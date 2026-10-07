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
- a passcode-gated operator screen (unlinked from the public site) for
  tracking requests, printing filing packages, and publishing timeline updates;
- a responsive Civic Magazine public design, chosen from the design archive;
- English/French message infrastructure for the public timeline;
- a Cloudflare Worker serving a read-only public timeline API backed by
  PostgreSQL, merged with the browser's local events and labelled by source.

The pilot research uses current official filing instructions and is documented in
[`docs/pilot-campaign-agency-nursing.md`](docs/pilot-campaign-agency-nursing.md).
The Phase 0 database schema and seed data live in
[`db/`](db/README.md); it is deployed to Neon and served through the Cloudflare
Worker. `infra/neon` manages the Neon project with Terraform. See
[`docs/production-inventory.md`](docs/production-inventory.md) for what is
provisioned and where each secret lives. Routes and fees must still be
re-verified immediately before any real filing.

The phased path to a production service—including real payments, live request
tracking, institution mapping, geographic hubs, social publishing and French—is
in [`docs/roadmap.md`](docs/roadmap.md). Draft campaign rules awaiting legal
review are in [`docs/campaign-rules-draft.md`](docs/campaign-rules-draft.md),
and the production platform recommendation is in
[`docs/production-platform-decision.md`](docs/production-platform-decision.md).

## Operator access

The operator workflow is unlinked from the public site. Open `#/operator`
directly and use the demo passcode `pilot-2026`. The gate is a workflow
boundary, not security; see
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
timeline API, and an Access-gated operator event endpoint. It does not collect
payments, retain public form submissions, or send public-records requests.
The operator dashboard still uses a demo passcode and stores request edits in
the browser; approved timeline events can reach the database through the
operator API, with a local fallback when it is unavailable. The print flow
requires current official route research and same-day route and fee checks;
requester details stay in the open tab and are never saved.

## Next useful milestone

Connect the operator dashboard to staff access and durable request records,
then remove local-only publish success from the production path. The exact
sequence and exit checks are in [`docs/roadmap.md`](docs/roadmap.md).
