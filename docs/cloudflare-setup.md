# Cloudflare and Neon setup

Step-by-step for running the API locally and deploying the approved
Cloudflare Workers + Neon stack. Nothing here is required to run the static
prototype; the GitHub Pages build has no API and falls back to the local
timeline store.

Architecture: Cloudflare Workers (TypeScript) serves both the built single-page
app and a read-only API. Neon Postgres is the system of record, reached through
a Cloudflare Hyperdrive binding in production and a plain connection string in
development. The schema is `db/schema.sql`; R2, Resend, Queues and Cron are
later phases and are not configured yet.

## What the API serves

| Route                                        | Purpose                                    |
| -------------------------------------------- | ------------------------------------------ |
| `GET /api/health`                             | Service and database status                |
| `GET /api/campaigns/:slug/timeline`           | Operator-approved public timeline events   |

The API is deliberately read-only. Operator writes still live in the browser
until real authentication exists. Anything that is not approved for public
visibility — internal notes, requester details, budgets — is filtered out in
SQL, never in the client.

## 1. Prerequisites

- Node 22 and npm.
- A Cloudflare account.
- A Neon account.
- For local database work, any PostgreSQL 15+ instance. Docker or Colima works:

  ```bash
  docker run -d --name cr-db -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:15
  ```

## 2. Run the API locally

Create the database and apply the schema and seed:

```bash
docker exec cr-db psql -U postgres -c 'create database cr;'
docker exec -i cr-db psql -U postgres -d cr -v ON_ERROR_STOP=1 < db/schema.sql
docker exec -i cr-db psql -U postgres -d cr -v ON_ERROR_STOP=1 < db/seed.sql
```

Create `.dev.vars` in the repository root. It is gitignored and must never be
committed:

```
DB_URL=postgresql://postgres:dev@127.0.0.1:5432/cr
```

Then run the Worker and the front end in two terminals:

```bash
npm run dev:worker   # builds, then starts wrangler dev on :8787
npm run dev          # Vite on :5173, proxying /api to :8787
```

Open the Vite URL. The campaign timeline should show the two seeded events and
the line "Live from the database". Stopping the Worker leaves the site working
against its local store, labelled as prototype data.

## 3. Provision Neon

1. Create a Neon project and a database.
2. Apply the schema and seed. Either paste `db/schema.sql` and `db/seed.sql`
   into the Neon SQL editor, or use the Neon CLI:

   ```bash
   neonctl connection-string --project-name <project>
   ```

3. Copy the **pooled** connection string. It is long-lived and safe for the
   Worker; the direct string is only for migrations and one-off queries.

## 4. Connect Hyperdrive

Hyperdrive gives the Worker connection pooling and query caching. Create it
once, using the pooled Neon string:

```bash
npx wrangler login
npx wrangler hyperdrive create common-record-db \
  --connection-string="postgresql://...pooler.../cr?sslmode=require"
```

Add the returned id to `wrangler.jsonc`:

```jsonc
"hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<returned-id>" }],
```

The connection string is stored in Cloudflare's secret store, not in the
repository. `worker/db.ts` prefers `HYPERDRIVE` and falls back to `DB_URL`.

## 5. Deploy

```bash
npm run deploy
```

`wrangler.jsonc` serves `dist` as static assets with single-page-application
fallback and `run_worker_first: ["/api/*"]`, so app routes resolve to
`index.html` and API routes reach the Worker.

To attach a custom domain:

```bash
npx wrangler domains add api.example.com
```

For a database that is not yet provisioned, the Worker still deploys and
serves the app; `/api/*` returns `503` and the site uses its local store.

## 6. Continuous integration

GitHub Actions still deploys the static prototype to Pages on every push to
`main`. Automating `wrangler deploy` is deliberately **not** wired up yet. When
it is, add a separate job guarded by a GitHub environment, with
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_DRY_RUN`
during review, so a pull request cannot publish the API by accident.

## Troubleshooting

**`/api/health` returns `{"database":"not-configured"}`** — neither a
Hyperdrive binding nor `DB_URL` is visible. Check `.dev.vars` exists and
contains `DB_URL`, then restart `wrangler dev`.

**A request hangs until the runtime cancels it** — `worker/db.ts` creates one
`pg` client per request on purpose. A cached `Pool` keeps an idle socket that
the Workers runtime reaps, and the next query then waits on a dead connection
forever. Do not reintroduce a shared pool.

**Timeline is empty on a deployed site** — check the campaign slug matches
`campaign.slug`, and that the events are approved with `visibility = 'public'`.
Internal `note` events are excluded by design.

**Timeline shows "Prototype data" on GitHub Pages** — expected. The Pages
build is static only and has no API to call.

**`npm run deploy` fails on authentication** — run `npx wrangler login`, or
set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Data safety

- `.dev.vars`, `.wrangler/` and `*.local` are gitignored. Never commit a
  connection string.
- The seed data is fictional pilot data. Replace it before any real use.
- Requester identity is still prototype-only: it stays in the print flow and is
  never stored. See `docs/operator-workflow-and-deployment.md`.