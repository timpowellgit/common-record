import { describe, expect, it, vi } from "vitest";
import { createApp } from "../worker/app";
import type { OperatorAuth } from "../worker/auth";
import type { Db, NewRequestEvent, StaffUser } from "../worker/db";

const operator: StaffUser = {
  id: "1",
  email: "tim@commonrecord.example",
  displayName: "Tim Powell",
  role: "operator",
};

const signedIn: OperatorAuth = {
  authenticate: async () => ({ email: operator.email, subject: "access-subject" }),
};

const anonymous: OperatorAuth = { authenticate: async () => null };

function makeDb(overrides: Partial<Db> = {}): Db {
  return {
    health: async () => true,
    campaignTimeline: async () => [],
    findStaffByEmail: async () => operator,
    createRequestEvent: async () => ({ id: "42", occurredOn: "2026-10-06" }),
    ...overrides,
  };
}

function post(
  db: Db | null,
  operatorAuth: OperatorAuth,
  body: unknown,
  slug = "agency-nursing-2022-26-pilot",
) {
  const app = createApp({ db, operatorAuth });
  return app.request(`/api/operator/campaigns/${slug}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  type: "submitted-and-delivered",
  occurredOn: "2026-10-06",
  title: "Request delivered to UHN",
  detail: "Delivered by registered mail.",
};

function get(path: string, db: Db | null, operatorAuth: OperatorAuth) {
  return createApp({ db, operatorAuth }).request(path);
}

describe("operator API", () => {
  it("mounts the durable request routes behind the same staff gate", async () => {
    const request = {
      id: "agency-nursing-2022-26-pilot:uhn",
      campaignId: "agency-nursing-2022-26-pilot",
      campaignTitle: "Pilot",
      institution: "University Health Network",
      filingMethod: "mail",
      filingDestination: "Toronto",
      status: "draft",
      applicationFeeCents: 500,
      quotedFeeCents: null,
      filedOn: null,
      dueOn: null,
      operatorNotes: "",
      updatedAt: "2026-10-06T00:00:00Z",
      version: 0,
      preflight: {},
      activity: [],
    };
    const db = makeDb({
      listOperatorRequests: async () => [request],
      patchOperatorRequest: async () => ({ status: "updated", request: { ...request, version: 1 } }),
    });
    const path = "/api/operator/campaigns/agency-nursing-2022-26-pilot/requests";
    const listed = await get(path, db, signedIn);
    expect(listed.status).toBe(200);
    expect((await listed.json()).requests).toHaveLength(1);
    expect((await get(path, db, anonymous)).status).toBe(401);
    const patched = await createApp({ db, operatorAuth: signedIn }).request(`${path}/${encodeURIComponent(request.id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ version: 0, note: "Reviewed" }),
    });
    expect(patched.status).toBe(200);
  });

  it("confirms a current operator session without caching it", async () => {
    const response = await get("/api/operator/session", makeDb(), signedIn);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ staff: { displayName: "Tim Powell", role: "operator" } });
  });

  it("does not confirm a missing or invalid Access identity", async () => {
    const response = await get("/api/operator/session", makeDb(), anonymous);
    expect(response.status).toBe(401);
  });

  it("does not confirm an unknown staff identity", async () => {
    const response = await get("/api/operator/session", makeDb({ findStaffByEmail: async () => null }), signedIn);
    expect(response.status).toBe(403);
  });

  it("limits operator access to operator and administrator roles", async () => {
    for (const role of ["researcher", "editor", "finance"]) {
      const db = makeDb({ findStaffByEmail: async () => ({ ...operator, role }) });
      expect((await get("/api/operator/session", db, signedIn)).status).toBe(403);
      expect((await post(db, signedIn, validBody)).status).toBe(403);
    }
    const administrator = makeDb({ findStaffByEmail: async () => ({ ...operator, role: "administrator" }) });
    expect((await get("/api/operator/session", administrator, signedIn)).status).toBe(200);
  });

  it("fails closed if staff lookup is unavailable", async () => {
    const db = makeDb({ findStaffByEmail: async () => { throw new Error("db down"); } });
    expect((await get("/api/operator/session", db, signedIn)).status).toBe(503);
    expect((await post(db, signedIn, validBody)).status).toBe(503);
  });

  it("redirects through the Access-protected login path back to the operator page", async () => {
    const response = await get("/api/operator/login", makeDb(), signedIn);
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost/#/operator");
    expect((await get("/api/operator/login", makeDb(), anonymous)).status).toBe(401);
  });

  it("requires authentication", async () => {
    const response = await post(makeDb(), anonymous, validBody);
    expect(response.status).toBe(401);
  });

  it("is unavailable without a database", async () => {
    const response = await post(null, signedIn, validBody);
    expect(response.status).toBe(503);
  });

  it("rejects a signed-in user who is not staff", async () => {
    const response = await post(makeDb({ findStaffByEmail: async () => null }), signedIn, validBody);
    expect(response.status).toBe(403);
  });

  it("creates a public event with the operator as approver", async () => {
    const createRequestEvent = vi.fn(
      async (_event: NewRequestEvent) => ({ id: "42", occurredOn: "2026-10-06" }),
    );
    const response = await post(makeDb({ createRequestEvent }), signedIn, validBody);
    expect(response.status).toBe(201);
    expect(createRequestEvent).toHaveBeenCalledWith({
      campaignSlug: "agency-nursing-2022-26-pilot",
      recordRequestExternalId: null,
      eventType: "submitted-and-delivered",
      occurredOn: "2026-10-06",
      title: "Request delivered to UHN",
      detail: "Delivered by registered mail.",
      visibility: "public",
      approvedByUserId: "1",
      approvedAt: expect.any(String),
    });
  });

  it("rejects an internal note as public", async () => {
    const response = await post(makeDb(), signedIn, { ...validBody, type: "note" });
    expect(response.status).toBe(400);
  });

  it("accepts an internal note as private", async () => {
    const response = await post(makeDb(), signedIn, {
      ...validBody,
      type: "note",
      visibility: "private",
    });
    expect(response.status).toBe(201);
  });

  it("rejects an unknown event type", async () => {
    const response = await post(makeDb(), signedIn, { ...validBody, type: "made-up" });
    expect(response.status).toBe(400);
  });

  it("rejects an empty title", async () => {
    const response = await post(makeDb(), signedIn, { ...validBody, title: "   " });
    expect(response.status).toBe(400);
  });

  it("rejects an impossible date", async () => {
    const response = await post(makeDb(), signedIn, { ...validBody, occurredOn: "2026-02-30" });
    expect(response.status).toBe(400);
  });

  it("returns 404 when the campaign is unknown", async () => {
    const response = await post(
      makeDb({ createRequestEvent: async () => null }),
      signedIn,
      validBody,
    );
    expect(response.status).toBe(404);
  });

  it("passes a request reference through to the database", async () => {
    const createRequestEvent = vi.fn(
      async (_event: NewRequestEvent) => ({ id: "43", occurredOn: "2026-10-06" }),
    );
    const response = await post(makeDb({ createRequestEvent }), signedIn, {
      ...validBody,
      requestRef: "uhn-2022-26",
    });
    expect(response.status).toBe(201);
    expect(createRequestEvent.mock.calls[0][0].recordRequestExternalId).toBe("uhn-2022-26");
  });
});
