# Operator workflow and activation

The public site and approved campaign timeline are live at `commonrecord.ca`.
The operator dashboard remains an implementation in progress. This document
distinguishes the current deployment from the local code awaiting activation.

## Current production boundary

- Cloudflare Access protects `/api/operator` and the Worker validates its
  signed assertion. The currently deployed browser dashboard still uses a
  demonstration passcode and keeps request edits in local storage; it is not
  an operational staff tool.
- The event-write API requires a known staff account. The documented Access
  policy admits `timpowelldk@gmail.com`, while the seeded staff row uses the
  example address `tim@commonrecord.example`. Do not claim a successful staff
  login until an approved, matching row exists and the real sign-in is tested.
- No request is filed and no fee is paid through this product. The public
  contribution/proposal interactions are demonstrations only.

## Implemented locally, not deployed

- On production hosts, `#/operator` checks `GET /api/operator/session` before
  rendering the dashboard. Missing or expired Access identity, unknown staff,
  and roles other than operator/administrator fail closed. Local development
  and GitHub Pages keep the clearly labelled demo passcode and fixtures.
- `GET /api/operator/campaigns/:slug/requests` returns the five-request staff
  projection. `PATCH /api/operator/campaigns/:slug/requests/:externalId`
  accepts a versioned draft/approved status, preflight checklist, or an
  append-only note. It rejects private fields, stale versions, and statuses
  that imply a real-world filing. The database writes an audit row in the same
  transaction and checks current route research before approval.
- The production dashboard client reads the server list and confirms edits
  before showing them. It does not fall back to local success when the server
  is unavailable. Fee/date editing and printing a letter remain disabled on
  production hosts. Printing in local/static demo uses tab-only requester
  details and is still not a filing action.
- `db/migrations/0001_operator_workflow.sql` adds durable checklist, version,
  and note immutability. It passed a fresh PostgreSQL 15 integration test but
  has **not** been applied to Neon.

## Activation sequence and exit gate

1. Review the additive migration and make a recoverable production backup or
   approved restore point. Apply it through an approved, logged change, then
   verify the five requests and existing public timeline are unchanged.
2. Provision the real Access email as a staff account with the least
   appropriate role. Do not change Access policy or production staff records
   implicitly as part of a code deploy.
3. Deploy the reviewed code through the protected production environment.
   Verify one authorized session, missing/expired Access, an unknown staff
   identity, a private-field rejection, a version conflict, and a confirmed
   note/checklist edit visible in another browser.
4. Run the read-only recovery check, then a separately approved isolated Neon
   branch restore drill using [the recovery runbook](database-recovery.md).
   Confirm audit, public/private separation, and rollback before declaring
   the workflow operational.

File storage, evidence attachments, server-generated letters, durable private
requester details, real filing, and payments remain separate later steps. The
five official routes and fees must be re-verified before any submission.
