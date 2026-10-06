# Cloudflare and Neon setup

No-browser setup for the approved Cloudflare Workers + Neon stack. Every step
is a CLI command. The only things that cannot be done without a browser are
creating the Neon account and minting the first API keys; after that, nothing
here needs the dashboard.

Architecture: Cloudflare Workers (TypeScript) serves the built single-page app
and a read-only API. Neon Postgres is the system of record, reached through a
Cloudflare Hyperdrive binding in production and a plain connection string in
development. The schema is `db/schema.sql`. R2, Resend, Queues and Cron are
later phases and are not configured yet.

## What the API serves

| Route                                | Purpose                                  |
| ------------------------------------ | ---------------------------------------- |
| `GET /api/health`                    | Service and database status              |
| `GET /api/campaigns/:slug/timeline`  | Operator-approved public timeline events |

The API is deliberately read-only. Operator writes still live in the browser
until real authentication exists. Anything not approved for public visibility —
internal notes, requester details, budgets — is filtered out in SQL, never in
the client.

## 0. One-time credentials (the only browser steps)

- **Neon**: sign up, then Account Settings → API Keys → create a key.
  `export NEON_API_KEY=...`
- **Cloudflare**: My Profile → API Tokens → create a token with
  `Workers Scripts:Edit`, `Hyperdrive:Edit`, `Account Settings:Read`, and
  `User Details:Read`. `export CLOUDFLARE_API_TOKEN=...`
- Get the Cloudflare account id without the dashboard:
  `curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" https://api.cloudflare.com/client/v4/accounts`
  `export CLOUDFLARE_ACCOUNT_ID=...`
- Get the Neon organization id the same way:
  `curl -H "Authorization: Bearer $NEON_API_KEY" https://console.neon.tech/api/v2/organizations`

Keep both keys out of the repository. `wrangler` reads `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID` from the environment, so `wrangler login` is never
needed.

## 1. Provision Neon with Terraform

The module in `infra/neon` manages the project, its primary branch, database and
role, and outputs the connection URIs. It needs Terraform 1.14+ and follows the
community `kislerdm/neon` provider, pinned to `0.18.0` (not officially supported
by Neon).

**Creating a new project:**

```bash
cd infra/neon
cp terraform.tfvars.example terraform.tfvars   # set neon_org_id
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

**Adopting an existing project** (this is what the live `common_record` project
uses — it was created in the Neon console, then imported):

```bash
cd infra/neon
# defaults already match: pg 18, aws-us-east-2, branch production, db neondb
terraform init
terraform import neon_project.common_record <project-id>
terraform plan          # expect: No changes.
terraform output -raw connection_uri_pooler
```

Find `<project-id>` via
`curl -H "Authorization: Bearer $NEON_API_KEY" https://console.neon.tech/api/v2/projects`.
`main.tf` sets `prevent_destroy`, so a changed config cannot silently recreate
the project.

### Remote state (Neon, `pg` backend)

State is stored in Neon with Terraform's `pg` backend, so it does not live on
one laptop and gets real locking. The backend is already configured in
`versions.tf`; you only supply the connection string.

```bash
export PG_CONN_STR="<direct Neon URI>?options=endpoint%3D<endpoint-id>"
cd infra/neon
terraform init -migrate-state -force-copy   # first time: copies local state up
```

Two things matter here:

- **Use the direct URI, not the pooler.** The backend locks state with
  session-level Postgres advisory locks, and PgBouncer transaction pooling does
  not preserve a session.
- **Append `options=endpoint=<endpoint-id>`** (URL-encoded as
  `options=endpoint%3D<id>`), where `<endpoint-id>` is the first label of the
  direct host (`ep-...`). Terraform's driver does not do SNI, and Neon requires
  it on the direct endpoint.

State lands in the `terraform_remote_state.states` table in the app's database.
`terraform.tfstate` is gitignored because it holds the database password; after
migration the local file is safe to delete. Do not run `terraform init -upgrade`
in CI; review provider upgrades by hand.

## 2. Load the schema

```bash
export DATABASE_URL="$(cd infra/neon && terraform output -raw connection_uri)"
scripts/apply-db-schema.sh "$DATABASE_URL"        # schema only
scripts/apply-db-schema.sh "$DATABASE_URL" --seed # plus pilot data
```

`psql` is required (`brew install libpq`, or add it to the DevBox shell). The
script never reads or writes a credential itself; the URI comes from the caller.

If you cannot install `psql`, the `pg` package already in `node_modules` can
apply the same files:

```bash
node -e "const{Client}=require('pg');const fs=require('fs');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();for(const f of ['db/schema.sql','db/seed.sql']){await c.query(fs.readFileSync(f,'utf8'));console.log('applied',f)}await c.end()})()"
```

## 3. Connect Hyperdrive

Hyperdrive gives the Worker connection pooling and query caching. It reads the
connection string from the environment, so no login prompt:

```bash
npx wrangler hyperdrive create common-record-db --connection-string="$DATABASE_URL"
```

Paste the returned `id` into the commented `hyperdrive` block in
`wrangler.jsonc` and uncomment it. The `id` is not a secret, so it is safe to
commit. Keep `localConnectionString` pointed at local Postgres so
`wrangler dev` never touches Neon.

## 4. Run the API locally

With a local PostgreSQL 15+ (Docker or Colima):

```bash
docker run -d --name cr-db -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:15
docker exec cr-db psql -U postgres -c 'create database cr;'
scripts/apply-db-schema.sh "postgresql://postgres:dev@127.0.0.1:5432/cr" --seed
```

Then either set the Hyperdrive block's `localConnectionString` (step 3) or a
gitignored `.dev.vars`:

```
DB_URL=postgresql://postgres:dev@127.0.0.1:5432/cr
```

Run the Worker and the front end in two terminals:

```bash
npm run dev:worker   # builds, then wrangler dev on :8787
npm run dev          # Vite on :5173, proxying /api to :8787
```

The timeline should show the seeded events and "Live from the database".
Stopping the Worker leaves the site working against its local store, labelled as
prototype data.

## 5. Deploy

```bash
npm run deploy
```

`wrangler.jsonc` serves `dist` with single-page-application fallback and
`run_worker_first: ["/api/*"]`, so app routes resolve to `index.html` and API
routes reach the Worker. If the database is not yet provisioned the Worker still
deploys; `/api/*` returns `503` and the site uses its local store.

Custom domain:

```bash
npx wrangler domains add api.example.com
```

## 6. Continuous integration

- `.github/workflows/ci.yml` runs typecheck, tests and build on every pull
  request and push to `main`. It uses no credentials.
- `.github/workflows/deploy-pages.yml` still deploys the static prototype to
  Pages on pushes to `main`.
- `.github/workflows/deploy-api.yml` deploys the Worker, but is **manual only**
  (`workflow_dispatch`) with a dry run by default. Add `CLOUDFLARE_API_TOKEN`
  and `CLOUDFLARE_ACCOUNT_ID` as repository secrets and attach the workflow to
  the `production` environment. Switch it to a push trigger with required
  reviewers only after a few manual deploys are trusted.

## Troubleshooting

**`/api/health` returns `{"database":"not-configured"}`** — neither a
Hyperdrive binding nor `DB_URL` is visible. Check `.dev.vars` or the Hyperdrive
block, then restart `wrangler dev`.

**A request hangs until the runtime cancels it** — `worker/db.ts` creates one
`pg` client per request on purpose. A cached `Pool` keeps an idle socket that
the Workers runtime reaps, and the next query then waits on a dead connection
forever. Do not reintroduce a shared pool.

**Timeline is empty on a deployed site** — check the campaign slug matches
`campaign.slug`, and that events are approved with `visibility = 'public'`.
Internal `note` events are excluded by design.

**Timeline shows "Prototype data" on GitHub Pages** — expected. The Pages build
is static only and has no API to call.

**`terraform apply` fails on `org_id`** — set `neon_org_id` in
`infra/neon/terraform.tfvars`; leaving it blank can create the project in the
wrong organization.

**Provider version errors on `terraform init`** — the `neon` provider is
community-maintained; adjust the `version` constraint in
`infra/neon/versions.tf` to the current release on the Terraform Registry.

## Data safety

- `.dev.vars`, `.wrangler/`, `*.local`, Terraform state and `*.tfvars` are
  gitignored. Never commit a connection string or a state file.
- The seed data is fictional pilot data. Replace it before any real use.
- Requester identity is still prototype-only: it stays in the print flow and is
  never stored. See `docs/operator-workflow-and-deployment.md`.
