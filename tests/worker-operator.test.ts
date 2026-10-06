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

describe("operator API", () => {
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
