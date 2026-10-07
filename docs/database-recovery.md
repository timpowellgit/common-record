# Database recovery drill

Status: **documented, not yet proven against a restored Neon branch.** This is
an operator runbook, not authority to restore or replace production data.

## What is protected

The production database is Neon project `broad-waterfall-40830289`, branch
`production` (`br-young-flower-b5ii41s9`), database `neondb`. Cloudflare
Hyperdrive connects the Worker to its pooled endpoint. The same database also
contains Terraform remote state in `terraform_remote_state`; a whole-branch
restore therefore rewinds *both* application data and infrastructure state.
See [production-inventory.md](production-inventory.md) for identifiers and
secret locations. Do not store connection strings, exports, private request
details, or drill logs containing them in git.

Neon supports point-in-time recovery within a **configured history window**
and isolated branches from a previous point in time. Do not assume the window
length from a plan's advertised maximum or an old article: read the *current*
project setting and earliest recoverable timestamp before setting an RPO.
Neon snapshots, when enabled on the project, may provide a longer-lived
recovery point; neither scheduled snapshots nor an independent off-provider
backup is confirmed here. [Neon explains PITR and time-travel
checks](https://neon.com/blog/announcing-point-in-time-restore) and
[isolated recovery branches](https://neon.com/blog/recover-production-database).

## Non-destructive drill — isolated branch only

Run this with an authorized operator, recording timestamps and results in a
private incident/drill log. A Neon branch creation has a cost and copies
production data, including private requester information; restrict its users
and retention accordingly. **Never point the production Worker, Hyperdrive,
Terraform backend, or DNS at the drill branch.**

1. Record UTC start time, Neon project and production branch IDs, configured
   history retention, earliest recoverable time, latest confirmed write, and
   chosen recovery timestamp. Check that the timestamp lies in the current
   window. Record current production campaign/request/event/audit *counts*
   using read-only queries; do not export sensitive rows into the drill log.
2. In Neon, create a **new child branch** from the production branch at the
   chosen timestamp, with its own compute endpoint. Verify its new branch and
   endpoint IDs, and that neither matches production. This is a state-changing
   Neon action and requires an explicit drill approval; no such action is
   performed by this runbook or repository code.
3. Obtain the **direct, non-pooled** connection string for the *new branch*
   from the approved secret-handling workflow. Make it available only as
   `RECOVERY_DATABASE_URL` in the operator's local environment (not a shell
   argument or committed file), then run:

   ```bash
   node scripts/check-db-recovery-readiness.mjs
   ```

   The script starts a read-only transaction, checks core tables and
   append-only triggers, counts rows without reading private values, and
   checks public-event approval invariants. It makes **no writes**, but a pass is only a smoke
   check. Compare counts to the expected state at the selected timestamp;
   recent writes may intentionally be absent.
4. On that isolated branch, manually verify a sample campaign, its request
   associations, approved timeline events, and the
   Terraform state schema. Use read-only transactions. Confirm public API
   queries would exclude `record_request_private` and `operator_note`. Do not
   use the production Access identity or production Worker to exercise this.
5. Record elapsed time, recovered timestamp, observed data loss window (RPO),
   time to a usable branch (RTO), discrepancies, and who reviewed the result.
   Delete the temporary branch only after explicit approval and evidence
   retention; its copy of private data remains subject to the same controls.

## Independent logical backup, still to be established

PITR in the same Neon project does not cover loss of project access or an
account-wide incident. Choose a separate encrypted destination with access
control, retention, monitoring, and an owner. A candidate process is a
PostgreSQL custom-format `pg_dump` over the **direct** connection, followed
by `pg_restore --list` and a restore into a disposable database outside the
production project. Do not dump through Hyperdrive. Treat archives as highly
sensitive: `record_request_private`, operator notes, and Terraform state are
included. Do not run, automate, or upload a production dump until that storage,
key handling, retention, and data-access scope are approved. A dump's existence
is not restore proof. [Neon distinguishes logical dumps from
PITR](https://neon.com/blog/announcing-point-in-time-restore).

## Actual incident / production restore gate

A production rewind can erase legitimate writes made after the recovery point,
including audit events, and can desynchronize Terraform's remote state. It may
briefly disrupt database connections. The incident owner must first freeze or
account for new writes, capture a current recovery point, establish the exact
target timestamp and affected rows, assess selective recovery versus full
rewind, and independently verify the proposed state on an isolated branch.
Require explicit approval for the exact production branch, timestamp, expected
loss, Terraform-state recovery plan, and rollback method. Recheck live branch
IDs and retention immediately before execution; stop on drift. Afterward,
verify application health, event counts, Access-gated writes, Terraform state,
and public/private data boundaries before reopening writes. This document does
**not** authorize that operation.

## Exit criteria still open

- Confirm live Neon history window and whether scheduled snapshots exist.
- Complete and time an isolated point-in-time branch drill with approved scope.
- Establish an encrypted independent backup and prove restore to a separate
  database, with ownership and alerting for missed backups.
- Set explicit RPO/RTO targets from those measured results, not provider claims.
