# Operator workflow and deployment

## Current boundary

The operator workflow is a front-end prototype. It stores edits in the current
browser's `localStorage`; there is no server-side authentication, shared
database, backup, email, payment processing, or public-records submission. The
researched institutions, routes, and fees in `src/data/` and `db/seed.sql` must
be re-verified immediately before any real filing.

## Operator access

The operator screen is no longer reachable through a public query parameter.
Open `#/operator` directly (for example
`timpowellgit.github.io/common-record/#/operator`). The route is unlinked from
the public site and sits behind a passcode gate using the demo passcode
`pilot-2026` (see `src/operator/OperatorGate.tsx`).

That gate is a workflow boundary, not security — the passcode ships in a
public repository. Do not expose this screen as a real admin surface until it
has server-side authentication, authorization, validation, an audit log, and
durable storage. Authorization lasts for the browser session only.

## Integrating the operator screen

The reusable component is exported from `src/operator/index.ts`:

```tsx
import { OperatorDashboard } from "./operator";

// Render behind an explicit prototype-only route or development toggle.
<OperatorDashboard />
```

The component imports its own stylesheet and needs no package dependency. Pass
`initialRequests` to replace the demo records and `storageKey` to isolate a test
dataset.

## Operator workflow represented

Each institution request has a status, filing route, application fee, optional
quoted fee, filed and due dates, notes, and a local activity history. The status
set covers draft, approved, filed, fee review, overdue, received, and published.
Changing a field records an activity item and persists the result locally. Reset
demo data removes the user's edits by replacing them with the bundled fixtures.

### Filing packages

Each request card contains a filing package with two parts:

- A **preflight checklist** (route re-verified, fee confirmed, wording approved,
  enclosures prepared). The checklist state persists with the request locally.
- **Requester details** (name, email, phone, mailing address). These fields are
  deliberately never written to `localStorage` — they exist only in the open
  tab, are used solely to build the printed letter, and are never published.

When every check is complete and the requester details satisfy the submission
route (mail needs a mailing address; email needs an email address), the
operator can open and print the request letter. The printed letter is the
operator-reviewed filing document: it carries the requester signature block
and omits the "draft, not submitted" notice that the public plan preview
shows. Printing a letter is still not filing; submission and payment remain
manual, outside this prototype.

### Publishing public timeline updates

Operators can publish campaign-level and request-level timeline updates from
the dashboard. Published events must carry an approver and approval time, are
validated by `src/domain/timeline.ts` (mirroring the `request_event` database
constraints), and appear on the campaign's public timeline — in this
prototype, still only within the same browser, via
`src/data/timeline-store.ts`. The publish form warns against entering
requester-identifying information. In production these writes go to the
`request_event` table and the public timeline reads from the database.

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
layer, so the operator screen contains no real requester data and its passcode
is a public-repository demo value.

Use one hosting path, not both, for the public canonical URL. Vercel is simplest
if a custom domain and preview links are likely; GitHub Pages keeps hosting within
the personal GitHub account. The production platform recommendation is recorded
in `docs/production-platform-decision.md`.

## Before this becomes operational

1. Replace the passcode gate with staff sign-in and server-side role checks.
2. Replace demo institutions with the researched, versioned institution
   directory (`db/schema.sql` is the target shape).
3. Move requests, timeline events, and audit records to durable storage with
   backups; keep private requester fields in `record_request_private`.
4. Keep review gates so generating a letter and filing it remain separate
   actions.
5. Verify filing routes, fees, legal deadlines, and request text immediately
   before each submission.
6. Add explicit handling for fee estimates, clarifications, extensions, appeals,
   partial releases, exemptions, and publication redaction.
