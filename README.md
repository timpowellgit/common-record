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
- a local-only operator screen for tracking requests and fee reviews;
- a responsive editorial visual system.

The pilot research uses current official filing instructions and is documented in
[`docs/pilot-campaign-agency-nursing.md`](docs/pilot-campaign-agency-nursing.md).
Routes and fees must still be re-verified immediately before any real filing.

The phased path to a production service—including real payments, live request
tracking, institution mapping, geographic hubs, social publishing and French—is
in [`docs/roadmap.md`](docs/roadmap.md).

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Checks

```bash
npm run check
npm test
npm run build
```

## Product boundary

This repository currently contains a front-end prototype. It does not collect payments, retain public form submissions, or send public-records requests. Operator changes are stored only in the current browser. Those boundaries are stated in the interface so it can be shared safely while the filing workflow is tested manually.

## Next useful milestone

Have a human review the five generated request letters and official filing routes, add requester details outside the public repository, and then decide whether to authorize the $25 pilot filing. Real submission and payment are intentionally not automated.
