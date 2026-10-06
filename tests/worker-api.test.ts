import { describe, expect, it } from "vitest";
import { createApp } from "../worker/app";
import { createDisabledAuth } from "../worker/auth";
import type { Db, TimelineRow } from "../worker/db";

function timelineRow(overrides: Partial<TimelineRow> = {}): TimelineRow {
  return {
    id: "12",
    campaignId: "agency-nursing-2022-26-pilot",
    requestRef: null,
    type: "research-completed",
    occurredOn: "2026-10-05",
    title: "Pilot research completed",
    detail: null,
    approvedBy: "Tim Powell",
    approvedAt: "2026-10-05T16:00:00.000Z",
    ...overrides,
  };
}

function makeDb(overrides: Partial<Db> = {}): Db {
  return {
    health: async () => true,
    campaignTimeline: async () => [
      timelineRow(),
      timelineRow({ id: "13", type: "routes-verified", occurredOn: "2026-10-06" }),
    ],
    findStaffByEmail: async () => null,
    createRequestEvent: async () => null,
    ...overrides,
  };
}

function makeApp(db: Db | null) {
  return createApp({ db, operatorAuth: createDisabledAuth() });
}

describe("createApp", () => {
  it("reports health with the database state", async () => {
    const app = makeApp(makeDb());
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "common-record-api",
      database: "up",
    });
  });

  it("reports health without a configured database", async () => {
    const app = makeApp(null);
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      service: "common-record-api",
      database: "not-configured",
    });
  });

  it("reports a down database without failing the service", async () => {
    const app = makeApp(makeDb({ health: async () => false }));
    const response = await app.request("/api/health");
    expect((await response.json()).database).toBe("down");
  });

  it("returns the public timeline for a campaign slug", async () => {
    const app = makeApp(makeDb());
    const response = await app.request(
      "/api/campaigns/agency-nursing-2022-26-pilot/timeline",
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { events: TimelineRow[] };
    expect(payload.events).toHaveLength(2);
    expect(payload.events[0]).toMatchObject({
      id: "12",
      campaignId: "agency-nursing-2022-26-pilot",
      type: "research-completed",
      occurredOn: "2026-10-05",
      approvedBy: "Tim Powell",
      approvedAt: "2026-10-05T16:00:00.000Z",
    });
  });

  it("returns 503 for the timeline when no database is configured", async () => {
    const app = makeApp(null);
    const response = await app.request("/api/campaigns/whatever/timeline");
    expect(response.status).toBe(503);
  });

  it("returns 503 when the database query fails", async () => {
    const app = makeApp(
      makeDb({
        campaignTimeline: async () => {
          throw new Error("connection refused");
        },
      }),
    );
    const response = await app.request("/api/campaigns/whatever/timeline");
    expect(response.status).toBe(503);
  });

  it("rejects malformed campaign slugs", async () => {
    const app = makeApp(makeDb());
    const response = await app.request("/api/campaigns/Bad_Slug/timeline");
    expect(response.status).toBe(404);
  });

  it("returns JSON 404 for unknown API routes", async () => {
    const app = makeApp(makeDb());
    const response = await app.request("/api/nope");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Unknown API route." });
  });
});
