# Database schema and recovery

`schema.sql` and `seed.sql` define the PostgreSQL system of record for the
researched five-hospital pilot: places, institutions, versioned filing routes,
the campaign, five draft requests, and operator-approved status events.

Status: **deployed to Neon.** The public timeline reads approved events from
the database. Other campaign and operator data still has prototype/local
paths; do not mistake those for durable production records. See
[`docs/production-inventory.md`](../docs/production-inventory.md) for the live
resource inventory and [`docs/database-recovery.md`](../docs/database-recovery.md)
for the non-destructive recovery drill and its unproved gates.

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
- `migrations/0001_operator_workflow.sql` adds versioned operator checklist
  state and an append-only note guard. It is tested locally but **not applied
  to production**; the Worker request routes must not be activated before it.

## Running locally for review

```bash
docker run --name common-record-db -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:15
psql postgresql://postgres:dev@localhost:5432/postgres -f db/schema.sql
psql postgresql://postgres:dev@localhost:5432/postgres -f db/seed.sql
psql postgresql://postgres:dev@localhost:5432/postgres -f db/migrations/0001_operator_workflow.sql
```

No migration tool is wired up yet. Review changes against an isolated database
before applying them to production; do not reapply this non-idempotent schema
to the live branch.

## Deliberately absent

Payments, contributions, ledger, refunds and payouts are Phase 2 and will get
their own schema with double-entry constraints rather than being back-filled
here.
