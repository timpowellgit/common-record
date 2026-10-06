# Common Record

**Fund the questions. Open the answers.**

Common Record is a working product concept for collectively commissioning public-information campaigns in Canada. People signal interest in a question, contribute toward the real cost of acquiring the records, and receive a public dataset—not just a folder of PDFs.

**Live prototype:** [timpowellgit.github.io/common-record](https://timpowellgit.github.io/common-record/)

This first version is deliberately small. It demonstrates:

- a campaign discovery homepage;
- detailed campaign budgets and public outputs;
- a no-payment contribution interaction;
- a public-question proposal form;
- a working supervised filing-plan generator for five Ontario hospitals;
- a public campaign timeline fed only by operator-approved events;
- a passcode-gated operator screen (unlinked from the public site) for
  tracking requests, printing filing packages, and publishing timeline updates;
- a responsive editorial visual system;
- English/French message infrastructure for the public timeline;
- a Cloudflare Worker serving a read-only public timeline API backed by
  PostgreSQL, merged with the browser's local events and labelled by source.

The pilot research uses current official filing instructions and is documented in
[`docs/pilot-campaign-agency-nursing.md`](docs/pilot-campaign-agency-nursing.md).
The Phase 0 database schema and seed data live in
[`db/`](db/README.md). It has been run end to end locally against PostgreSQL 15
through the Cloudflare Worker, but no database is deployed yet. Routes and fees
must still be re-verified immediately before any real filing.

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

This repository currently contains a front-end prototype plus a read-only
timeline API. It does not collect payments, retain public form submissions, or
send public-records requests. Operator changes and published timeline events are
stored only in the current browser, and are written to the database by no code
path yet. Printed request letters contain requester details only in the open tab
and are never saved. Those boundaries are stated in the interface so it can be
shared safely while the filing workflow is tested manually.

## Next useful milestone

Use the operator screen to complete the preflight checklist for each of the five requests, enter requester details in the print flow, print and review the letters against the official filing routes, and then decide whether to authorize the $25 pilot filing. Real submission and payment are intentionally not automated.
