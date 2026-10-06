# Production platform decision — draft

**Status: recommendation prepared, decision pending (Tim).**

The roadmap's next sprint starts with selecting production hosting, database,
object storage, and email. This note compares the realistic options and makes
one recommendation so the decision can be made quickly rather than reopened
each phase. Cost figures are rough 2026 list prices for a low-traffic pilot.

## Recommendation

| Layer | Pick | Why |
|---|---|---|
| Hosting | **Vercel** (Hobby, later Pro) | Already configured via `vercel.json`; preview deployments per PR; SPA + serverless functions cover Phase 1 |
| Database | **Neon** Postgres (free tier, then Scale) | Matches `db/schema.sql` exactly; branching for preview environments; no server to run |
| Object storage | **Cloudflare R2** | No egress fees matters for published records and datasets; S3-compatible |
| Email | **Resend** | Transactional email with verified domain, webhooks, and a generous pilot tier |
| Migrations | **Drizzle** or **node-pg-migrate** | Small surface; applied in CI against a preview branch, never auto-applied to production |

Total estimated running cost before real traffic: under $10/month, dominated
by R2 storage and the eventual Vercel Pro upgrade.

## Alternatives considered

- **Fly.io + self-managed Postgres** — more control, but backups, restores,
  and certificate rotation become our job. Not worth it before Phase 2.
- **Supabase** — bundled auth, storage, and Postgres in one place; attractive,
  but the auth and storage coupling makes the eventual multi-provider exit
  harder, and the roadmap's role model is simpler than Supabase's RLS needs.
- **GitHub Pages + a separate API host** — the current prototype deploys this
  way; keeping it means running two hosting paths and losing server-rendered
  public pages (Phase 1 requirement).
- **AWS (S3 + Lambda + RDS)** — cheapest at scale, most operational weight.
  Revisit only if traffic justifies it.

## Consequences of the recommendation

- The React/TypeScript prototype continues as the design reference; Phase 1
  adds server-side actions (Vercel functions) rather than a rewrite.
- `db/schema.sql` becomes Drizzle/node-pg-migrate migrations applied to Neon;
  the front-end fixtures are replaced by API reads.
- The operator passcode gate is replaced by real staff auth (email + TOTP)
  with server-side role checks.
- Object URLs for correspondence and releases live in R2 with immutable
  checksums recorded in Postgres.
- All four vendors allow export; no vendor receives data it does not need.

## Decisions Tim still owns

1. Confirm or override the recommendation (Supabase is the strongest
   alternative if you want auth bundled).
2. Choose and register the production domain.
3. Create the accounts and hold the credentials (not in this repository).
