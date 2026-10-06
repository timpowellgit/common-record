# Production platform decision — draft

**Status: recommendation updated 2026-10-06 after verifying current Cloudflare
and Vercel documentation. Decision still Tim's.**

The roadmap's next sprint starts with selecting production hosting, database,
object storage, and email. This note compares the realistic options and makes
one recommendation so the decision can be made quickly rather than reopened
each phase.

## What these picks replace

None of this is exotic; each pick replaces a concrete status-quo or
alternative:

| Pick | Instead of |
|---|---|
| Cloudflare Workers (hosting) | The prototype's static-only GitHub Pages / Vercel hosting; Fly.io; Supabase hosting; AWS |
| Neon (Postgres) | Nothing — today the "database" is hard-coded fixtures plus browser `localStorage`; also instead of Supabase Postgres, AWS RDS, or self-run Postgres on a VM |
| Cloudflare R2 (object storage) | S3, Supabase storage, or Backblaze B2 — R2 has zero egress fees, which matters for published records |
| Resend (email) | SES, Postmark, or Mailgun — Cloudflare has no transactional send product (Email Routing only forwards inbound) |

## Recommendation

**Cloudflare Workers + Neon Postgres (via Hyperdrive) + R2 + Resend.**

| Layer | Pick | Why |
|---|---|---|
| Hosting | **Cloudflare Workers** with static assets, Workers Paid ($5/month flat) | Serves our exact Vite SPA (`not_found_handling = "single-page-application"`) and the API worker in one deploy on one domain; Vercel's free Hobby plan is non-commercial only and Pro is $20/user/month |
| Database | **Neon** Postgres, free tier then Scale | Runs `db/schema.sql` unchanged (D1 cannot: it is SQLite with a 10 GB cap — no enums, `citext`, triggers, or partial indexes); connected from Workers through Hyperdrive for pooling and caching; branch-per-preview |
| Object storage | **Cloudflare R2** | Zero egress fees for published records and datasets; S3-compatible |
| Email | **Resend** | Transactional email with verified domain and webhooks; nobody (including Cloudflare) offers this natively in the stack |
| Background jobs | **Cloudflare Queues + Cron Triggers** | Native email-ingestion and daily deadline jobs; Vercel has cron but no durable queues |
| Migrations | **node-pg-migrate** or Drizzle | Small surface; applied in CI against a Neon branch, never auto-applied to production |

Estimated pilot cost: $0 on free tiers until real traffic; $5/month flat
(Workers Paid) once queues or sustained traffic justify it.

## What the research showed (checked 2026-10-06)

- Cloudflare Workers [static
  assets](https://developers.cloudflare.com/workers/static-assets/) hosts a
  full-stack app — SPA plus API worker — in a single deploy; their React
  starter templates target Workers, and `wrangler` supports the SPA fallback
  our current Vite build needs.
- Cloudflare has **no first-party managed Postgres**. The documented SQL
  options are D1 (SQLite, 10 GB max), SQLite in Durable Objects, or
  [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) accelerating an
  external Postgres such as Neon. Our schema is Postgres-specific, so Neon
  stays in the stack either way.
- Vercel's
  [Hobby plan](https://vercel.com/docs/plans/hobby) "restricts users to
  non-commercial, personal use only"; Pro is $20 per user per month. Phase 2
  contributions make this a commercial use, so Vercel's real entry price is
  $240+/year for a one-operator project.
- R2 and Queues are first-party on Cloudflare and priced with no egress or
  per-seat components.

## Where Cloudflare is weaker (honestly)

- Workers run on V8 isolates, not Node. Server code needs `nodejs_compat` and
  occasionally different libraries — more assembly than Vercel's plain Node
  functions.
- Preview deployments (Workers Builds) exist and work, but Vercel's
  per-branch previews are still the best in class.
- More moving parts to wire by hand (wrangler config, Hyperdrive binding,
  queue consumers) versus Vercel's zero-config defaults.

If those bother us more than $240/year and per-seat pricing, the runner-up
stack is the previous recommendation: Vercel (Pro) + Neon + R2 + Resend.

## Alternatives considered

- **Vercel + Neon** — best DX and previews; costs $20/user/month the moment
  the project takes money; no native queues.
- **Fly.io + self-managed Postgres** — more control, but backups, restores,
  and certificate rotation become our job. Not worth it before Phase 2.
- **Supabase** — bundled auth, Postgres, and storage; the coupling makes a
  multi-provider exit harder, and we still need R2-class egress-free storage
  for releases.
- **GitHub Pages + separate API host** — the current prototype deploys this
  way; keeping it means two hosting paths and no server-rendered public pages
  (Phase 1 requirement).
- **AWS (S3 + Lambda + RDS)** — cheapest at scale, most operational weight.

## Consequences for this repository

- `db/schema.sql` is unchanged — it targets Neon Postgres as-is.
- The Vite app stays; Phase 1 adds a Worker (`/api/*` routes, Hono or
  similar), a `wrangler.jsonc` with the SPA fallback, R2 and Hyperdrive
  bindings, and the Cloudflare Vite plugin for local development.
- The operator passcode gate is replaced by real staff auth (email + TOTP)
  with server-side role checks.
- Object URLs for correspondence and releases live in R2 with immutable
  checksums recorded in Postgres.
- All vendors allow export; no vendor receives data it does not need.

## Decisions Tim still owns

1. Confirm Cloudflare-first (or override for Vercel DX).
2. Choose and register the production domain.
3. Create the accounts and hold the credentials (not in this repository).
