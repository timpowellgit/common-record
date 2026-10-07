import { Client } from "pg";
import { describe, expect, it } from "vitest";
import { createDbFromConnectionString } from "../worker/db";

const connectionString = process.env.CR_WORKFLOW_TEST_DB_URL;

describe.skipIf(!connectionString)("operator workflow against migrated PostgreSQL", () => {
  it("lists five requests and atomically versions, notes, and audits an edit", async () => {
    const db = createDbFromConnectionString(connectionString!);
    const campaignSlug = "agency-nursing-2022-26-pilot";
    const requests = await db.listOperatorRequests!(campaignSlug);
    expect(requests).toHaveLength(5);
    expect(requests.every((request) => request.status === "draft" && request.version === 0)).toBe(true);

    const first = requests[0];
    const staff = await db.findStaffByEmail("tim@commonrecord.example");
    expect(staff).not.toBeNull();
    const updated = await db.patchOperatorRequest!({
      campaignSlug,
      externalId: first.id,
      expectedVersion: 0,
      preflight: { route: true, routeConfirmedOn: new Date().toISOString().slice(0, 10) },
      note: "Route checked during integration test.",
      actorId: staff!.id,
    });
    expect(updated.status).toBe("updated");
    if (updated.status !== "updated") return;
    expect(updated.request.version).toBe(1);
    expect(updated.request.operatorNotes).toBe("Route checked during integration test.");
    expect(updated.request.activity).toHaveLength(1);

    const stale = await db.patchOperatorRequest!({
      campaignSlug,
      externalId: first.id,
      expectedVersion: 0,
      note: "This must not be written.",
      actorId: staff!.id,
    });
    expect(stale.status).toBe("conflict");

    const prematureApproval = await db.patchOperatorRequest!({
      campaignSlug,
      externalId: first.id,
      expectedVersion: 1,
      status: "approved",
      actorId: staff!.id,
    });
    expect(prematureApproval.status).toBe("conflict");

    const client = new Client({ connectionString });
    await client.connect();
    try {
      const result = await client.query<{ notes: string; audits: string }>(`
        select
          (select count(*)::text from operator_note n where n.record_request_id = r.id) as notes,
          (select count(*)::text from audit_event a where a.entity_kind = 'record_request' and a.entity_id = r.id) as audits
        from record_request r where r.external_id = $1
      `, [first.id]);
      expect(result.rows[0]).toEqual({ notes: "1", audits: "1" });
    } finally {
      await client.end();
    }
  });
});
