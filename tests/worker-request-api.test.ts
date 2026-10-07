import { describe, expect, it, vi } from "vitest";
import type { OperatorAuth } from "../worker/auth";
import type {
  Db,
  OperatorRequestPatch,
  OperatorRequestRow,
  StaffUser,
} from "../worker/db";
import { createRequestApi } from "../worker/request-api";

const staff: StaffUser = {
  id: "1",
  email: "staff@commonrecord.example",
  displayName: "Staff Operator",
  role: "operator",
};
const authenticated: OperatorAuth = {
  authenticate: async () => ({ email: staff.email, subject: "access-subject" }),
};
const anonymous: OperatorAuth = { authenticate: async () => null };

const request: OperatorRequestRow = {
  id: "agency-nursing-2022-26-pilot:uhn",
  campaignId: "agency-nursing-2022-26-pilot",
  campaignTitle: "Agency nursing pilot",
  institution: "University Health Network",
  filingMethod: "email",
  filingDestination: "foi@example.invalid",
  status: "draft",
  applicationFeeCents: 500,
  quotedFeeCents: null,
  filedOn: null,
  dueOn: null,
  operatorNotes: "",
  updatedAt: "2026-10-06T00:00:00.000Z",
  version: 0,
  preflight: {},
  activity: [],
};

function makeDb(overrides: Partial<Db> = {}): Db {
  return {
    health: async () => true,
    campaignTimeline: async () => [],
    findStaffByEmail: async () => staff,
    createRequestEvent: async () => null,
    listOperatorRequests: async () => [request],
    patchOperatorRequest: async () => ({ status: "updated", request: { ...request, version: 1 } }),
    ...overrides,
  };
}

const path = "/campaigns/agency-nursing-2022-26-pilot/requests";
function patch(db: Db, body: unknown, auth = authenticated) {
  const app = createRequestApi({ db, operatorAuth: auth });
  return app.request(`${path}/${encodeURIComponent(request.id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("request workflow API", () => {
  it("fails closed without a configured database or Access identity", async () => {
    const unavailable = createRequestApi({ db: null, operatorAuth: authenticated });
    expect((await unavailable.request(path)).status).toBe(503);
    const signedOut = createRequestApi({ db: makeDb(), operatorAuth: anonymous });
    expect((await signedOut.request(path)).status).toBe(401);
  });

  it("requires a known staff user and permits only operators to edit", async () => {
    const unknown = createRequestApi({
      db: makeDb({ findStaffByEmail: async () => null }),
      operatorAuth: authenticated,
    });
    expect((await unknown.request(path)).status).toBe(403);
    const researcher = makeDb({ findStaffByEmail: async () => ({ ...staff, role: "researcher" }) });
    expect((await createRequestApi({ db: researcher, operatorAuth: authenticated }).request(path)).status).toBe(200);
    expect((await patch(researcher, { version: 0, note: "Reviewed" })).status).toBe(403);
  });

  it("returns only the operator request projection", async () => {
    const response = await createRequestApi({ db: makeDb(), operatorAuth: authenticated }).request(path);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ requests: [request] });
  });

  it("rejects private fields, invalid versions, and statuses that imply filing", async () => {
    expect((await patch(makeDb(), { version: 0, requesterName: "Private" })).status).toBe(400);
    expect((await patch(makeDb(), { version: -1, note: "Reviewed" })).status).toBe(400);
    expect((await patch(makeDb(), { version: 0, status: "filed" })).status).toBe(400);
    expect((await patch(makeDb(), { version: 0, preflight: { route: "yes" } })).status).toBe(400);
  });

  it("passes a versioned note and checklist edit to the database", async () => {
    const patchOperatorRequest = vi.fn(async (_patch: OperatorRequestPatch) => ({
      status: "updated" as const,
      request: { ...request, version: 2 },
    }));
    const response = await patch(makeDb({ patchOperatorRequest }), {
      version: 1,
      preflight: { route: true, routeConfirmedOn: "2026-10-06" },
      note: "  Route checked  ",
    });
    expect(response.status).toBe(200);
    expect(patchOperatorRequest).toHaveBeenCalledWith({
      campaignSlug: request.campaignId,
      externalId: request.id,
      expectedVersion: 1,
      status: undefined,
      preflight: { route: true, routeConfirmedOn: "2026-10-06" },
      note: "Route checked",
      actorId: staff.id,
    });
  });

  it("reports an optimistic concurrency conflict without claiming success", async () => {
    const response = await patch(makeDb({ patchOperatorRequest: async () => ({ status: "conflict" }) }), {
      version: 0,
      status: "approved",
    });
    expect(response.status).toBe(409);
  });
});
