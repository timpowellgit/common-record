# Database schema (Phase 0 design)

`schema.sql` and `seed.sql` define the PostgreSQL system of record for the
researched five-hospital pilot: places, institutions, versioned filing routes,
the campaign, five draft requests, and operator-approved status events.

Status: **designed, not deployed.** The public site is still the Vite prototype
with browser-storage operator data. This schema is the migration target for the
Phase 1 production build; the front-end fixtures in
`src/data/` and `src/operator/` deliberately mirror its shape so the cutover is
a data move, not a redesign.

## Boundaries encoded in the schema

- Private requester identity, contact details, and signature live only in
  `record_request_private`, a separate 1:1 table, so no public query path needs
  to touch them.
- `request_event` and `audit_event` are append-only; updates and deletes raise
  an exception via trigger.
- A public event requires an approver and approval timestamp; `note`-type
  events cannot be made public.
- Filing routes are versioned with `verified_at`/`expires_at` (seeded with a
  30-day expiry) so stale routes cannot be silently reused.
- Fees are integer cents.

## Running locally for review

```bash
docker run --name common-record-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:15
psql postgresql://postgres:dev@localhost:5432/postgres -f db/schema.sql
psql postgresql://postgres:dev@localhost:5432/postgres -f db/seed.sql
```

No migration tool is wired up yet. Choose one as part of the production
platform decision (`docs/production-platform-decision.md`).

## Deliberately absent

Payments, contributions, ledger, refunds and payouts are Phase 2 and will get
their own schema with double-entry constraints rather than being back-filled
here.
