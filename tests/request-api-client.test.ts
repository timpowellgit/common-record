import { afterEach, describe, expect, it, vi } from "vitest";
import { listOperatorRequests, patchOperatorRequest } from "../src/operator/request-api";

const serverRequest = {
  id: "uhn-001",
  campaignId: "agency-nursing",
  campaignTitle: "Agency nursing",
  institution: "University Health Network",
  filingMethod: "Email",
  filingDestination: "foi@example.test",
  status: "draft",
  applicationFeeCents: 500,
  quotedFeeCents: null,
  filedOn: null,
  dueOn: null,
  operatorNotes: "",
  updatedAt: "2026-10-06T12:00:00.000Z",
  version: 1,
  preflight: {},
  activity: [],
};

afterEach(() => vi.unstubAllGlobals());

describe("operator request client", () => {
  it("loads authoritative server requests and maps cents to display dollars", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ requests: [serverRequest] }), { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    const result = await listOperatorRequests("agency-nursing");
    expect(result).toMatchObject({ status: "ok", value: [{ id: "uhn-001", applicationFee: 5, version: 1 }] });
    expect(fetcher).toHaveBeenCalledWith("/api/operator/campaigns/agency-nursing/requests", {
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("never invents a local success when the server rejects a write", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Operator access required." }), { status: 401 })));
    const result = await patchOperatorRequest("agency-nursing", "uhn-001", { version: 1, status: "approved" });
    expect(result).toEqual({ status: "error", message: "Operator access required." });
  });

  it("surfaces concurrent edits rather than overwriting them", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 409 })));
    const result = await patchOperatorRequest("agency-nursing", "uhn-001", { version: 1, note: "Reviewed." });
    expect(result.status).toBe("conflict");
  });

  it("reports network loss as unsaved", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await patchOperatorRequest("agency-nursing", "uhn-001", { version: 1, note: "Reviewed." }))
      .toEqual({ status: "error", message: "The edit could not reach the server. Nothing was saved." });
  });
});
