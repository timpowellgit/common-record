# Common Record operational roadmap

This roadmap takes Common Record from a public prototype to a bilingual Canadian service that can accept real contributions, file and track real access-to-information requests, and publish reusable records and datasets.

The sequence matters. Payments should not launch before campaign rules, refunds, accounting, security and operational ownership are ready. Automated filing should not launch before an institution's route has been manually verified end to end.

## Status — 2026-10-06

The Cloudflare Worker serves the public site at `commonrecord.ca`, with Neon
Postgres behind Hyperdrive. GitHub Pages remains a static design/prototype
deployment. The public timeline can read approved events from the database;
the broader campaign and operator experience still uses bundled data and
browser storage. Provisioning is recorded in `docs/production-inventory.md`.

Completed foundations:

- [x] **Database schema designed and deployed** — `db/schema.sql` and
  `db/seed.sql` cover places, institutions, versioned filing routes, the
  campaign, five draft requests, and append-only status/audit events, with
  private requester data in a separate table. Applied to Neon after local
  PostgreSQL validation.
- [x] **Operator screen behind a gated route** — `#/operator` with a session
  passcode gate; no public query parameter or footer link. A workflow boundary,
  not authentication.
- [x] **Printable request packages with preflight** — per-request checklist,
  private requester fields that are never persisted, and a print-formatted
  letter that only unlocks when preflight and requester details are complete.
- [x] **Public campaign timeline** — operator-approved events only, validated
  to the same rules the database enforces; shown on the pilot campaign page.
  Prototype events still live in browser storage, not the database.
- [x] **Internationalization infrastructure** — `src/i18n/` with complete
  English and French dictionaries for the new public strings and a
  compile/runtime completeness check. The full French surface remains Phase 7.
- [x] **Campaign rules drafted** — `docs/campaign-rules-draft.md` covers
  surplus, failure, withdrawal, narrowing, appeals, refunds, chargebacks and
  privacy, ready for legal and accounting review.
- [x] **Hosting and database selected and provisioned** — Cloudflare Workers
  and Neon Postgres via Hyperdrive; the public timeline is database-backed.
  The earlier platform note is a historical recommendation, not an open
  hosting decision.
- [x] **Operator API and Access boundary provisioned** — the custom domain,
  Cloudflare Access application, signed-JWT verification, and guarded
  `POST /api/operator/campaigns/:slug/events` route exist. This does not make
  the browser's demo passcode a production staff login.
- [x] **Visual direction selected and applied to the static public site** —
  Civic Magazine, gallery concept 20, now shapes the homepage and campaign
  index and is deployed on `commonrecord.ca`. The campaign detail panel still
  contains clearly labelled prototype contribution and proposal interactions.
- [x] **Filing-package preflight tightened** — printing requires same-day
  route and fee confirmations, plus current verified route research with an
  official source link and review date. This is a local supervised gate, not
  proof of a live filing or a persisted operator workflow.

In progress:

- [~] **Durable operator workflow** — a server-checked Access gate, role checks,
  versioned request API, audit-backed notes and preflight state, and a matching
  dashboard client are deployed. The additive migration is proven on scratch
  PostgreSQL, not applied to Neon; the real Access email is not yet a
  provisioned staff account. The live dashboard therefore fails closed rather
  than offering staff request editing.
- [~] **Database-backed public site** — the timeline is live and authoritative;
  campaign discovery, budgets, proposal and contribution interactions remain prototype
  data or local UI. The static Pages gallery is not the live data source.

Not started: file storage and scanning, payments, transactional email,
deadline jobs, social publishing, and Quebec filing-route research. No real
request has been filed through the product.

## Product destination

Common Record should let someone:

1. discover active public-information campaigns for their city or province;
2. see the question, scope, institutions, costs, contributors and likely public output;
3. contribute securely or register free interest;
4. follow every request, fee estimate, delay, release and appeal on a public timeline;
5. receive campaign updates through the site, email and social channels; and
6. download the original records, normalized data and methodology in English or French.

The internal team should be able to research institutions, compile request packages, approve every submission, reconcile payments and fees, manage correspondence, publish releases and preserve a complete audit trail.

## Operating principles

- **Public benefit first.** Contributions fund acquisition and publication; they do not buy control over findings.
- **Truthful status.** Distinguish proposed, researched, funding, funded, filed, delayed, partially released, appealed and published.
- **Human approval at consequential steps.** Filing, fee payment, narrowing, withdrawal and appeal always require an authorized operator.
- **Evidence attached.** Every status change should link to the supporting letter, receipt, acknowledgment or release.
- **No silent gaps.** Missing, withheld and incomparable data must remain visible.
- **Geography is first-class.** Campaigns and institutions belong to explicit cities, provinces or federal jurisdiction.
- **English and French are equal product surfaces.** French is not a machine-translated afterthought.

## Phase 0 — Finish the real pilot foundation

**Goal:** turn the current five-hospital prototype into a filing-ready, auditable pilot without yet accepting money.

### Work

- Add an authenticated operator area instead of exposing the operator demo through a public query parameter.
- Move campaigns, institutions, requests, status events and operator notes from hard-coded data and browser storage into PostgreSQL.
- Add private fields for requester identity, contact details, signatures, receipts and internal notes.
- Keep public fields separate so private filing information cannot leak through APIs or page source.
- Generate printable request letters and institution forms for UHN, Sunnybrook, Hamilton Health Sciences, LHSC and The Ottawa Hospital.
- Add a preflight that requires fresh verification of every address, fee and payment route.
- Add file storage for correspondence, receipts and released records, with malware scanning and immutable checksums.
- Add a public campaign timeline driven by operator-approved status events.
- Add campaign-level cost accounting: application fees, processing fees, postage, labour and remaining reserve.
- Draft the campaign rules for surplus, failure, withdrawal, narrowing, appeals and incomplete releases.

### Exit gate

- An operator can create the five filing packages, approve them, record delivery and acknowledgment, and publish redacted timeline events without editing code.
- Private requester data is inaccessible from public pages and unauthenticated APIs.
- Restore, access-control and file-upload tests pass.
- The pilot can be run manually from start to finish even if automation stops.

## Phase 1 — Launch a real public site

**Goal:** replace the portfolio prototype with a reliable, measurable public service before payments launch.

### Recommended production shape

- React/TypeScript application with server-rendered public pages for discovery and search.
- PostgreSQL as the system of record.
- Object storage for request letters, correspondence, releases and datasets.
- Background jobs for email ingestion, deadline calculation, social drafts and file processing.
- Transactional email for verification, receipts and campaign updates.
- Error monitoring, privacy-safe analytics, uptime monitoring and automated backups.
- Separate preview, staging and production environments with reviewed database migrations.

The current Vite prototype can remain the design reference. Choose the production framework during this phase; do not rewrite it solely for fashion. The required capabilities are secure server-side actions, authentication, background work and reliable deployment.

### Public features

- Campaign directory with filtering by city, province, topic and status.
- Permanent campaign pages with stable URLs and social preview images.
- Institution pages showing jurisdiction, filing route, mapped processes, active requests and historical response patterns.
- Free interest registration with verified email and unsubscribe controls.
- Public request timelines and a clear “last verified” timestamp.
- Accessible document and dataset downloads with source and methodology metadata.
- Proposal intake with spam protection, moderation and consent language.
- Search-engine metadata, sitemap, robots policy and structured data.

### Operational requirements

- Terms of use, privacy notice, records-retention schedule and acceptable-campaign policy.
- Threat model covering account takeover, document uploads, forged status events and payment abuse.
- Role-based access: researcher, operator, editor, finance and administrator.
- Two-factor authentication for staff and an append-only audit log for sensitive actions.
- Encrypted backups plus a documented restore test.
- Accessibility review against WCAG 2.2 AA.

### Exit gate

- A person can find a real campaign, register interest and follow verified progress.
- Operators can run the pilot without developer intervention.
- Production monitoring, backups, restore testing, analytics and incident ownership are active.

## Phase 2 — Take real payments safely

**Goal:** accept contributions for defined campaigns without creating an ambiguous wallet, donation or investment product.

### Initial payment model

- Use hosted Stripe Checkout for one-time CAD contributions.
- Set a practical minimum contribution rather than processing literal 25-cent transactions.
- Treat contributions as restricted campaign funding under published terms, not as investments or purchases of influence.
- Do not issue charitable tax receipts unless an eligible registered organization is actually responsible for them.
- Avoid transferable balances, peer-to-peer payments and cash withdrawals in the first release.

### Required work before activation

- Decide which legal entity receives funds and contracts with contributors.
- Obtain Canadian legal and accounting review covering consumer protection, refunds, taxes, privacy, unclaimed funds and campaign failure.
- Publish exact rules for overfunding, underfunding, fee overruns, abandoned campaigns, chargebacks and surplus allocation.
- Create a Stripe product and price strategy, webhook endpoint and idempotent event processing.
- Store money as integer cents and maintain an internal double-entry ledger for contributions, refunds, fees, campaign allocations and institutional payments.
- Reconcile the internal ledger against Stripe payouts and the bank account.
- Send receipts and expose contribution history without revealing contributor identities publicly by default.
- Support anonymous public attribution while retaining the payer information legally required by the payment provider.
- Add fraud controls, rate limits and manual review for unusually large contributions.
- Add finance reports and a monthly reconciliation checklist.

### Payment state model

`created → checkout_started → paid → allocated → spent_or_refunded`

Chargebacks and partial refunds must be separate ledger events; never rewrite financial history in place.

### Exit gate

- Test-mode payments, refunds, webhook retries and reconciliation pass end to end.
- A finance owner and incident procedure exist.
- Legal terms and campaign failure rules are published.
- A small, capped real campaign completes one contribution, one receipt and one reconciliation before the feature is opened broadly.

## Phase 3 — Map more institution processes

**Goal:** build a maintained Canadian filing-route registry, starting with one province and selected municipalities.

### Institution registry

Each institution record should include:

- legal name, aliases and institution type;
- country, province or territory, municipality and governing access law;
- FOI office, official instructions URL and request form;
- allowed filing channels and whether email is accepted;
- payment methods, application fee and processing-fee rules;
- identity, signature and residency requirements where applicable;
- statutory response period and extension rules;
- portal-specific constraints and concurrency limits;
- accessibility notes and language availability;
- source URL, last verified date, verifier and evidence snapshot; and
- adapter maturity: researched, manually proven, assisted or automated.

### Expansion order

1. Ontario hospitals and major cities used by active campaigns.
2. Ontario ministries, agencies, school boards, universities and police services.
3. Federal Access to Information institutions.
4. Quebec institutions, coordinated with the French-language launch.
5. Remaining provinces and territories based on campaign demand and partner capacity.

### Mapping workflow

- Research only from official sources.
- Require a second-person review for fees and submission destinations.
- Re-verify immediately before every filing.
- Record the outcome of the first manual submission.
- Automate only after the route succeeds repeatedly.
- Expire mappings after a defined interval and block unattended filing when stale.

### Exit gate

- At least 25 high-value institutions have reviewed mappings.
- Every automated field is traceable to a current official source.
- Stale routes are visibly flagged and cannot be used for unattended submission.

## Phase 4 — Live tracking of requests and current issues

**Goal:** make campaign progress accurate, timely and useful without pretending every inbound message can be interpreted automatically.

### Tracking model

Each request should expose a public timeline built from structured events:

- draft approved;
- submitted and delivered;
- acknowledgment received;
- statutory deadline set;
- clarification requested or answered;
- extension claimed;
- fee estimate received, approved, disputed or paid;
- response overdue;
- partial or final decision received;
- records released;
- appeal considered, filed or resolved; and
- dataset extraction and publication completed.

### Automation

- Give each request a unique inbound email alias.
- Ingest email and attachments into a private review queue.
- Suggest event types, dates and required actions; require operator confirmation before public posting.
- Calculate deadlines from the applicable law and institution acknowledgment, with explicit overrides.
- Run daily jobs for approaching deadlines, overdue responses, unpaid approved fees and unanswered clarification requests.
- Publish a public “current issues” view showing delays, fee disputes, missing institutions, active appeals and incomplete datasets.
- Add an incident banner for platform outages or known stale data.

### Exit gate

- Every public status has evidence and an approving operator.
- Deadline calculations have jurisdiction-specific tests.
- Missed and disputed deadlines appear without manual page editing.
- Email parsing failure cannot silently change public state.

## Phase 5 — City and province hubs

**Goal:** make the product locally useful rather than presenting one undifferentiated national feed.

### Geographic model

Use a hierarchy that supports both jurisdiction and subject geography:

`Canada → province/territory → municipality → institution`

A campaign may involve multiple places, but it must identify the law and filing institution for each request.

### Hub pages

- `/on` — Ontario campaigns, institutions, response metrics and guides.
- `/on/toronto` — Toronto campaigns and institutions.
- `/qc` and `/qc/montreal` once Quebec operations are ready.
- Topic filters within each place: housing, health, policing, education, climate and procurement.
- Local explanatory copy covering the applicable law, fees and typical process.
- Place-specific newsletters and social feeds only after there is enough activity to sustain them.

Do not create hundreds of empty location pages. Launch a hub when it has a maintained guide, mapped institutions and at least one real campaign or published dataset.

### Exit gate

- Ontario and one city hub contain real campaigns and maintained filing guidance.
- URLs, metadata, search and analytics preserve geographic context.
- Cross-jurisdiction campaigns remain understandable at the individual-request level.

## Phase 6 — Connect social media and distribution

**Goal:** turn verified campaign events into useful public updates without allowing automation to publish misleading claims.

### Channel strategy

- Start with Bluesky, Mastodon and LinkedIn; add other networks only when there is a real audience and a maintainable API path.
- Generate share cards and canonical links for campaigns, milestones and published datasets.
- Create an operator review queue for suggested posts.
- Publish automatically only for low-risk, deterministic events such as “campaign reached its funding target” after the underlying transaction is reconciled.
- Require editorial approval for findings, refusals, fee disputes, allegations, appeals and institution-specific commentary.
- Preserve the exact post text, approver, destination, remote post ID and publication time.
- Add UTM-tagged links and privacy-safe campaign attribution.
- Support deletion or correction workflows without deleting the internal audit history.

### Update templates

- campaign opened;
- funding milestone reached;
- request filed;
- acknowledgment or extension received;
- fee estimate requires a community decision;
- first records released; and
- dataset and methodology published.

### Exit gate

- Social credentials are stored outside the codebase and scoped to the minimum permissions.
- Failed or duplicate publishing is safely retryable.
- Public claims cannot be posted without a verified campaign event and required approval.

## Phase 7 — French version

**Goal:** provide a genuinely bilingual service and prepare for Quebec and federal campaigns.

### Foundation

- Internationalize routes, metadata, UI strings, email, receipts, validation and status labels from the beginning of production work.
- Use locale-prefixed URLs such as `/en/...` and `/fr/...`, with correct language alternates and canonical metadata.
- Store campaign titles, summaries, findings and methodology as independently reviewable localized content.
- Keep institution names and released-record titles in their official language while providing explanatory translations where useful.
- Format dates, currency and numbers by locale.
- Let users choose language; do not rely only on browser detection.

### Translation workflow

- Maintain a reviewed terminology guide for access-to-information law and campaign states.
- Use professional or qualified community review for legal request wording, payment terms, privacy notices and findings.
- Machine translation may create an internal draft but must never silently publish legal or evidentiary content.
- Show when a source document exists only in one language.
- Test layouts for longer French strings and screen-reader pronunciation.

### Quebec readiness

French UI alone is not Quebec operational readiness. Before Quebec campaigns launch, map the applicable provincial and municipal process, fees, deadlines, review body, language obligations and institution-specific filing routes.

### Exit gate

- Core public journeys, transactional email and staff workflows pass bilingual review.
- Legal and payment copy has qualified French review.
- French pages are complete rather than partially falling back to English without notice.

## Cross-cutting engineering backlog

### Core data model

- users and roles;
- places and jurisdictions;
- institutions and verified filing routes;
- campaigns, budgets and localized content;
- requests, correspondence, deadlines and approval gates;
- files, checksums, redactions and provenance;
- contributions, ledger entries, refunds and payouts;
- datasets, schemas and source-row links;
- subscriptions and communication preferences; and
- audit events.

### Reliability and security

- CI checks for types, tests, migrations, accessibility and production builds.
- Dependency and secret scanning.
- Content Security Policy, rate limiting, CSRF protection and secure cookies.
- Encryption in transit and at rest.
- File quarantine and malware scanning.
- Least-privilege service accounts and credential rotation.
- Database point-in-time recovery plus periodic restore drills.
- Documented incident response and breach notification ownership.

### Data publication

- Preserve raw releases separately from normalized datasets.
- Link every normalized value back to a source file and page or row.
- Version datasets and methodology.
- Publish machine-readable metadata and stable download URLs.
- Record redactions, exclusions, non-responses and definition mismatches.

## Suggested delivery sequence

| Release | User-visible result | Depends on |
|---|---|---|
| 0.2 | Real pilot timeline and database-backed operator workflow | Public timeline live; durable operator workflow remains |
| 0.3 | Production public site with interest registration | Phases 0–1 |
| 0.4 | Five requests manually filed and publicly tracked | Explicit filing approval |
| 0.5 | Capped real contributions through Stripe | Phase 2 gates |
| 0.6 | 25 mapped institutions and live current-issues dashboard | Phases 3–4 |
| 0.7 | Ontario and Toronto geographic hubs | Phase 5 |
| 0.8 | Reviewed social publishing workflow | Phase 6 |
| 0.9 | Complete French product surface | Phase 7 foundation |
| 1.0 | Bilingual, audited, payment-enabled multi-campaign service | All production gates |

## Immediate next sprint

The next sprint connects the selected public design to the operational spine
already deployed. Deliverables are ordered so each can be reviewed separately:

1. **Civic Magazine and truthful public boundary — deployed.** The selected
   design and authoritative database timeline are live; the two timeline
   events were verified once each. Proposal and contribution interactions are
   still explicitly labelled as prototypes.
2. **Staff access — deployed, not activated.** The server-enforced Access and
   role gate is live. Provision the correct staff identity, then verify
   authorized, unauthorized and expired sessions against production.
3. **Five-request workflow — deployed, not activated.** Review and apply
   `db/migrations/0001_operator_workflow.sql`, then verify the deployed
   versioned request API and dashboard client. Requester contact details remain tab-only
   in the local prototype; live printing is disabled until server-backed route
   and letter generation are ready.
4. **Verify production publishing end to end.** The code now makes a failed
   API write show failure instead of a local success on production hosts.
   After deployment, test successful writes, retries, unauthorized writes,
   private-field rejection, and cross-browser visibility of an approved event.
5. **Prove recovery and pilot readiness.** A non-destructive restore runbook
   and read-only smoke check now exist; complete an approved isolated branch
   drill, then verify five filing packages against current official routes and fees, and
   document who approves filing, redaction and public updates. Keep actual
   submission and payment behind Tim's separate authorization.

Sprint exit: the public site uses the selected design without overstating
product status; a real authorized operator can update the pilot's five request
records and publish a redacted event that another browser can read; failures
do not silently create local-only history; private fields remain out of the
public API; and a restore has been demonstrated. The site still takes no money
and sends no requests automatically.

## Decisions Tim must make

- Whether the project begins as a personal business, corporation, nonprofit or partnership with an existing organization.
- Who acts as the legal requester and publishes their contact information to institutions.
- Whether the first campaign is funded personally, by a partner or through the first public contribution test.
- Which city becomes the first municipal hub after Ontario.
- Which social accounts and public voice represent Common Record.
- Who provides qualified Canadian legal, accounting and French-language review.

These decisions do not block design or database workflow development, but
requester identity blocks real filing, and entity and funding decisions block
real payments and a fully public operational launch.
