# Common Record

**Fund the questions. Open the answers.**

Common Record is a working product concept for collectively commissioning public-information campaigns in Canada. People signal interest in a question, contribute toward the real cost of acquiring the records, and receive a public dataset—not just a folder of PDFs.

This first version is deliberately small. It demonstrates:

- a campaign discovery homepage;
- detailed campaign budgets and public outputs;
- a no-payment contribution interaction;
- a public-question proposal form;
- a supervised “compile filing plan” interaction;
- a responsive editorial visual system.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Checks

```bash
npm run check
npm run build
```

## Product boundary

This repository currently contains a front-end prototype. It does not collect payments, retain form submissions, or send public-records requests. Those boundaries are stated in the interface so it can be shared safely while the filing workflow is tested manually.

## Next useful milestone

Replace the sample campaign with one real Ontario campaign involving 5–10 institutions, then add a reviewed campaign definition that can generate tailored request letters and a filing checklist.
