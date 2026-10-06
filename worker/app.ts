import { Hono } from "hono";
import { publicTimelineEventTypes } from "../src/domain/timeline";
import type { OperatorAuth, OperatorIdentity } from "./auth";
import type { Db } from "./db";

export type AppDeps = {
  db: Db | null;
  operatorAuth: OperatorAuth;
};

type AppEnv = { Variables: { operator: OperatorIdentity } };

const slugPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const eventTypePattern = /^[a-z][a-z0-9-]{1,40}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const publicEventTypes = new Set<string>(publicTimelineEventTypes);
const privateOnlyEventTypes = new Set<string>(["note"]);

function isRealDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function createApp({ db, operatorAuth }: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get("/api/health", async (c) => {
    if (!db) {
      return c.json({ ok: true, service: "common-record-api", database: "not-configured" });
    }
    const up = await db.health();
    return c.json({
      ok: true,
      service: "common-record-api",
      database: up ? "up" : "down",
    });
  });

  app.get("/api/campaigns/:slug/timeline", async (c) => {
    const slug = c.req.param("slug");
    if (!slugPattern.test(slug)) {
      return c.json({ error: "Unknown campaign." }, 404);
    }
    if (!db) {
      return c.json({ error: "Database is not configured." }, 503);
    }
    try {
      const events = await db.campaignTimeline(slug);
      return c.json({ events });
    } catch {
      return c.json({ error: "The timeline is temporarily unavailable." }, 503);
    }
  });

  const operator = new Hono<AppEnv>();

  operator.use("*", async (c, next) => {
    if (!db) {
      return c.json({ error: "Operator API is not configured." }, 503);
    }
    const identity = await operatorAuth.authenticate(c.req.raw);
    if (!identity) {
      return c.json({ error: "Operator access required." }, 401);
    }
    c.set("operator", identity);
    await next();
  });

  operator.post("/campaigns/:slug/events", async (c) => {
    const slug = c.req.param("slug");
    if (!slugPattern.test(slug)) {
      return c.json({ error: "Unknown campaign." }, 404);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Expected a JSON body." }, 400);
    }

    if (typeof body !== "object" || body === null) {
      return c.json({ error: "Expected a JSON object." }, 400);
    }
    const input = body as Record<string, unknown>;

    const visibility = input.visibility === "private" ? "private" : "public";
    const eventType = typeof input.type === "string" ? input.type : "";
    if (!eventTypePattern.test(eventType)) {
      return c.json({ error: "A valid event type is required." }, 400);
    }
    if (visibility === "public" && !publicEventTypes.has(eventType)) {
      return c.json({ error: `"${eventType}" cannot be published publicly.` }, 400);
    }
    if (visibility === "private" && !privateOnlyEventTypes.has(eventType) && !publicEventTypes.has(eventType)) {
      return c.json({ error: "Unknown event type." }, 400);
    }

    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title.length === 0 || title.length > 200) {
      return c.json({ error: "A title of 1 to 200 characters is required." }, 400);
    }

    const occurredOn = typeof input.occurredOn === "string" ? input.occurredOn : "";
    if (!isRealDate(occurredOn)) {
      return c.json({ error: "occurredOn must be a real YYYY-MM-DD date." }, 400);
    }

    let detail: string | null = null;
    if (input.detail !== undefined && input.detail !== null) {
      if (typeof input.detail !== "string" || input.detail.length > 2000) {
        return c.json({ error: "detail must be a string of at most 2000 characters." }, 400);
      }
      detail = input.detail.length > 0 ? input.detail : null;
    }

    let recordRequestExternalId: string | null = null;
    if (typeof input.requestRef === "string" && input.requestRef.length > 0) {
      if (input.requestRef.length > 120) {
        return c.json({ error: "requestRef is too long." }, 400);
      }
      recordRequestExternalId = input.requestRef;
    }

    const identity = c.get("operator");
    try {
      const staff = await db!.findStaffByEmail(identity.email);
      if (!staff) {
        return c.json({ error: "Your account is not a Common Record operator." }, 403);
      }
      const created = await db!.createRequestEvent({
        campaignSlug: slug,
        recordRequestExternalId,
        eventType,
        occurredOn,
        title,
        detail,
        visibility,
        approvedByUserId: staff.id,
        approvedAt: new Date().toISOString(),
      });
      if (!created) {
        return c.json({ error: "Unknown campaign or request." }, 404);
      }
      return c.json(
        { event: { id: created.id, occurredOn: created.occurredOn, type: eventType, title, visibility } },
        201,
      );
    } catch {
      return c.json({ error: "The event could not be saved." }, 503);
    }
  });

  app.route("/api/operator", operator);

  app.all("/api/*", (c) => c.json({ error: "Unknown API route." }, 404));

  return app;
}
