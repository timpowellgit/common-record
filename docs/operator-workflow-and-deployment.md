# Operator workflow and deployment

## Current boundary

The operator workflow is a front-end prototype. It stores edits in the current
browser's `localStorage`; there is no authentication, shared database, backup,
email, payment processing, or public-records submission. The bundled institutions,
routes, dates, and fees are fictional interface fixtures and must be verified
before any real filing.

## Integrating the operator screen

The reusable component is exported from `src/operator/index.ts`:

```tsx
import { OperatorDashboard } from "./operator";

// Render behind an explicit prototype-only route or development toggle.
<OperatorDashboard />
```

The component imports its own stylesheet and needs no package dependency. Pass
`initialRequests` to replace the demo records and `storageKey` to isolate a test
dataset. Do not expose this screen as a real admin surface until it has server-side
authentication, authorization, validation, an audit log, and durable storage.

## Operator workflow represented

Each institution request has a status, filing route, application fee, optional
quoted fee, filed and due dates, notes, and a local activity history. The status
set covers draft, approved, filed, fee review, overdue, received, and published.
Changing a field records an activity item and persists the result locally. Reset
demo data removes the user's edits by replacing them with the bundled fixtures.

## Vercel deployment

`vercel.json` configures the Vite build, `dist` output, and a single-page-app
fallback. Import the personal GitHub repository into Vercel and deploy it with
the defaults. No environment variables or secrets are required for the prototype.
Preview deployments are the safest first step. Publishing on Vercel changes only
the hosted prototype; it does not enable any operator action.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` builds on pushes to `main` and can also be
started manually. In the personal repository settings, choose **GitHub Actions**
as the Pages source. The workflow supplies the repository subpath to Vite, uploads
`dist`, and deploys it. GitHub Pages has no server-side secret or authentication
layer, so the operator screen should remain unlinked and contain no sensitive data.

Use one hosting path, not both, for the public canonical URL. Vercel is simplest
if a custom domain and preview links are likely; GitHub Pages keeps hosting within
the personal GitHub account.

## Before this becomes operational

1. Replace demo institutions with a researched, versioned institution directory.
2. Add real sign-in and server-side role checks before exposing operator data.
3. Move records and audit events to durable storage with backups.
4. Add review gates so generating a letter and filing it remain separate actions.
5. Verify filing routes, fees, legal deadlines, and request text immediately before
   each submission.
6. Add explicit handling for fee estimates, clarifications, extensions, appeals,
   partial releases, exemptions, and publication redaction.
