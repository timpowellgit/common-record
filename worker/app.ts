import { Hono } from "hono";
import type { Db } from "./db";

export type AppDeps = {
  db: Db | null;
};

const slugPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function createApp({ db }: AppDeps) {
  const app = new Hono();

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

  app.all("/api/*", (c) => c.json({ error: "Unknown API route." }, 404));

  return app;
}
