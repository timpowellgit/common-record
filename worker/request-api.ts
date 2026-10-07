import { Hono } from "hono";
import type { OperatorAuth } from "./auth";
import type { Db, StaffUser, WorkflowPreflight } from "./db";

type Env = { Variables: { staff: StaffUser } };
type Dependencies = { db: Db | null; operatorAuth: OperatorAuth };

const slugPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const requestIdPattern = /^[a-z0-9][a-z0-9:-]{0,119}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const readRoles = new Set(["researcher", "operator", "editor", "administrator"]);
const writeRoles = new Set(["operator", "administrator"]);
const preflightBooleans = ["route", "fee", "wording", "enclosures"] as const;
const preflightDates = ["routeConfirmedOn", "feeConfirmedOn"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parsePreflight(value: unknown): WorkflowPreflight | null {
  if (!isObject(value)) return null;
  const allowed = new Set<string>([...preflightBooleans, ...preflightDates]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return null;
  for (const key of preflightBooleans) {
    if (value[key] !== undefined && typeof value[key] !== "boolean") return null;
  }
  for (const key of preflightDates) {
    if (value[key] !== undefined && !validDate(value[key])) return null;
  }
  return value as WorkflowPreflight;
}

/**
 * Mount at /api/operator in worker/app.ts. This router has its own Access and
 * staff-role checks, so it also fails closed if mounted outside that router.
 */
export function createRequestApi({ db, operatorAuth }: Dependencies) {
  const app = new Hono<Env>();

  app.use("*", async (c, next) => {
    if (!db?.listOperatorRequests || !db.patchOperatorRequest) {
      return c.json({ error: "Request workflow is not configured." }, 503);
    }
    const identity = await operatorAuth.authenticate(c.req.raw);
    if (!identity) return c.json({ error: "Operator access required." }, 401);
    try {
      const staff = await db.findStaffByEmail(identity.email);
      if (!staff || !readRoles.has(staff.role)) {
        return c.json({ error: "Staff access required." }, 403);
      }
      c.set("staff", staff);
      await next();
    } catch {
      return c.json({ error: "Staff access is temporarily unavailable." }, 503);
    }
  });

  app.get("/campaigns/:slug/requests", async (c) => {
    const slug = c.req.param("slug");
    if (!slugPattern.test(slug)) return c.json({ error: "Unknown campaign." }, 404);
    try {
      const requests = await db!.listOperatorRequests!(slug);
      return c.json({ requests });
    } catch {
      return c.json({ error: "Requests are temporarily unavailable." }, 503);
    }
  });

  app.patch("/campaigns/:slug/requests/:externalId", async (c) => {
    const staff = c.get("staff");
    if (!writeRoles.has(staff.role)) {
      return c.json({ error: "Operator role required to edit requests." }, 403);
    }
    const campaignSlug = c.req.param("slug");
    const externalId = c.req.param("externalId");
    if (!slugPattern.test(campaignSlug) || !requestIdPattern.test(externalId)) {
      return c.json({ error: "Unknown request." }, 404);
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Expected a JSON body." }, 400);
    }
    if (!isObject(body)) return c.json({ error: "Expected a JSON object." }, 400);
    const allowed = new Set(["version", "status", "preflight", "note"]);
    if (Object.keys(body).some((key) => !allowed.has(key))) {
      return c.json({ error: "Unsupported or private request field." }, 400);
    }
    const version = body.version;
    if (!Number.isSafeInteger(version) || (version as number) < 0) {
      return c.json({ error: "A non-negative request version is required." }, 400);
    }
    if (!["status", "preflight", "note"].some((key) => key in body)) {
      return c.json({ error: "No request changes were supplied." }, 400);
    }
    if (body.status !== undefined && body.status !== "draft" && body.status !== "approved") {
      return c.json({ error: "Only draft and approved status changes are enabled." }, 400);
    }
    let preflight: WorkflowPreflight | undefined;
    if ("preflight" in body) {
      const parsed = parsePreflight(body.preflight);
      if (parsed === null) return c.json({ error: "Invalid preflight checklist." }, 400);
      preflight = parsed;
    }
    let note: string | undefined;
    if ("note" in body) {
      if (typeof body.note !== "string" || body.note.trim().length === 0 || body.note.length > 2000) {
        return c.json({ error: "A note must contain 1 to 2000 characters." }, 400);
      }
      note = body.note.trim();
    }
    try {
      const result = await db!.patchOperatorRequest!({
        campaignSlug,
        externalId,
        expectedVersion: version as number,
        status: body.status as "draft" | "approved" | undefined,
        preflight,
        note,
        actorId: staff.id,
      });
      if (result.status === "not-found") return c.json({ error: "Unknown request." }, 404);
      if (result.status === "conflict") {
        return c.json({ error: "Request changed or approval preflight is incomplete. Reload and review it." }, 409);
      }
      return c.json({ request: result.request });
    } catch {
      return c.json({ error: "The request could not be saved." }, 503);
    }
  });

  return app;
}
