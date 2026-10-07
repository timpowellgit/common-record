# Common Record

**Who has the records we need?**

Common Record is a working product concept for collectively commissioning public-information campaigns in Canada. People signal interest in a question, contribute toward the real cost of acquiring the records, and receive a public dataset—not just a folder of PDFs.

**Live:** [commonrecord.ca](https://commonrecord.ca/) (database-backed Worker and
Neon Postgres) · [static prototype](https://timpowellgit.github.io/common-record/)
(GitHub Pages, prototype data)

This first version is deliberately small. It demonstrates:

- a campaign discovery homepage;
- detailed campaign budgets and public outputs;
- a no-payment contribution interaction;
- a public-question proposal form;
- a working supervised filing-plan generator for five Ontario hospitals;
- a public campaign timeline fed only by operator-approved events;
- an unlinked operator screen for tracking requests, printing filing packages,
  and publishing timeline updates; production uses Cloudflare Access and a
  staff database record, while local/Pages previews use a demo passcode;
- a responsive Civic Magazine public design, chosen from the design archive;
- English/French message infrastructure for the public timeline;
- a Cloudflare Worker serving a read-only public timeline API backed by
  PostgreSQL, with local prototype events shown only when the API is unavailable.

The pilot research uses current official filing instructions and is documented in
[`docs/pilot-campaign-agency-nursing.md`](docs/pilot-campaign-agency-nursing.md).
The Phase 0 database schema and seed data live in
[`db/`](db/README.md); it is deployed to Neon and served through the Cloudflare
Worker. `infra/neon` describes the Neon project in Terraform; its current state
backend still needs migration to independent storage. See
[`docs/production-inventory.md`](docs/production-inventory.md) for what is
provisioned, and [`docs/secret-and-iac-setup.md`](docs/secret-and-iac-setup.md)
for the prepared 1Password and state migration plan. Routes and fees must still be
re-verified immediately before any real filing.

The phased path to a production service—including real payments, live request
tracking, institution mapping, geographic hubs, social publishing and French—is
in [`docs/roadmap.md`](docs/roadmap.md). Draft campaign rules awaiting legal
review are in [`docs/campaign-rules-draft.md`](docs/campaign-rules-draft.md),
and the production platform recommendation is in
[`docs/production-platform-decision.md`](docs/production-platform-decision.md).

## Operator access

The operator workflow is unlinked from the public site. On production, open
`#/operator` and sign in with Cloudflare Access; the dashboard still requires
a matching staff record and a pending migration before staff editing works.
The demo passcode `pilot-2026` applies only to local and GitHub Pages previews; see
[`docs/operator-workflow-and-deployment.md`](docs/operator-workflow-and-deployment.md).

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

To also run the database-backed API, follow
[`docs/cloudflare-setup.md`](docs/cloudflare-setup.md). In short: start a local
PostgreSQL, apply `db/schema.sql` and `db/seed.sql`, put a `DB_URL` in a
gitignored `.dev.vars`, then run `npm run dev:worker` alongside `npm run dev`.

## Checks

```bash
npm run check
npm test
npm run build
```

## Product boundary

This repository contains a front-end prototype, a database-backed public
timeline API, and Access-gated operator endpoints. It does not collect
payments, retain public form submissions, or send public-records requests.
The production operator dashboard fails closed until a real staff record exists;
durable request edits also await the pending database migration. Local previews
use a demo passcode and browser-only request edits. Approved timeline events
can reach the database through the operator API. A failed production write is not shown as published; local event
fallback is limited to the static prototype and local development. The print flow
requires current official route research and same-day route and fee checks;
requester details stay in the open tab and are never saved.

## Next useful milestone

Connect the operator dashboard to staff access and durable request records,
then verify production publishing and recovery across browsers. The exact
sequence and exit checks are in [`docs/roadmap.md`](docs/roadmap.md).
