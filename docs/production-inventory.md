# Production inventory

What is actually provisioned for Common Record, where each piece lives, and
which parts were done by hand outside this repository. No secret values are
recorded here — only identifiers and the location of each secret.

Last reviewed: 2026-10-06.

## Live URLs

- **Public site + API:** https://commonrecord.ca (and https://www.commonrecord.ca)
- **Worker (direct):** https://common-record.common-record.workers.dev
- **Health:** https://commonrecord.ca/api/health → `{"database":"up"}`
- **Operator API (Access-gated):** `/api/operator/session`, campaign events,
  and request list/edit routes; request editing awaits its database migration
  and a real staff account.
- **Static prototype (GitHub Pages):** https://timpowellgit.github.io/common-record/

The GitHub Pages build is static only and shows prototype data. The Cloudflare
deployment is the database-backed one.

## Cloudflare

- **Account id:** `3ab255f27a8d6e9d4ef9fa11818da326`
- **Worker:** `common-record` (config in `wrangler.jsonc`)
- **Workers.dev subdomain:** `common-record` → `common-record.common-record.workers.dev`
- **Hyperdrive config:** `common-record-db`, id `095d3df782194351a6268c4ed9abbc8c`
  (referenced from `wrangler.jsonc`; origin is the Neon pooled URI, stored by
  Cloudflare, not in this repo)
- **Access team domain:** `commonrecord.cloudflareaccess.com`
- **Access application:** "Common Record operator",
  id `2d18e1c8-77d3-4800-bb72-121105904ff0`, scoped to
  `commonrecord.ca/api/operator` (public site is not gated)
- **Access policy:** allow, one-time PIN to `timpowelldk@gmail.com`,
  id `e57797c2-d37a-46f7-8206-551ad736a079`
- **Worker secrets:** `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` (values in Cloudflare,
  not in this repo)
- **Custom domains:** `commonrecord.ca` and `www.commonrecord.ca`, attached to
  the Worker

## Domain

- `commonrecord.ca` registered through Cloudflare Registrar, expires
  2027-10-06. **Confirm auto-renew is enabled.**
- Nameservers: `johnathan.ns.cloudflare.com`, `kayleigh.ns.cloudflare.com`
- Zone id: `1665a6533b61b169f93397dde66886d3`

## Neon

- **Project:** `common_record`, id `broad-waterfall-40830289`, PostgreSQL 18,
  `aws-us-east-2`
- **Branch:** `production` (`br-young-flower-b5ii41s9`)
- **Database / role:** `neondb` / `neondb_owner`
- **Organization id:** `org-square-surf-19471265` — see `infra/neon/terraform.tfvars` locally
- Connection strings (direct and pooled) are secrets: the pooled one is stored
  in Hyperdrive; the direct one is what the Terraform `pg` backend uses.
- Schema and seed applied; the public timeline reads from here.

## Terraform

- Module `infra/neon` manages the Neon project. It was created in the Neon
  console and brought under Terraform with `terraform import`; `terraform plan`
  shows no drift.
- **State lives in Neon**, in the `terraform_remote_state` schema (the `pg`
  backend). The connection comes from `PG_CONN_STR` — the **direct** Neon URI
  with `options=endpoint=<id>` appended. No local `terraform.tfstate` remains.
- Provider `kislerdm/neon` 0.18.0, pinned; Terraform 1.16.5.

## GitHub

- **Repo:** `timpowellgit/common-record`
- **Secrets:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`
- **Environment:** `production`, required reviewer `timpowellgit`
- **Workflows:** `ci.yml` (check/test/build), `deploy-pages.yml` (static
  prototype), `deploy-api.yml` (deploys the Worker on push to `main`, gated by
  the `production` environment)

## Where secrets live (never in git)

| Secret | Location |
| --- | --- |
| Cloudflare API token | GitHub secret `CLOUDFLARE_API_TOKEN` |
| Neon API key | ephemeral; not stored in the repo |
| Neon connection strings / DB password | Hyperdrive + Terraform state (Neon) |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | Worker secrets |
| Local dev DB URL | gitignored `.dev.vars` |

## Done by hand, not yet in code (IaC gaps)

- Registering the domain and the initial `workers.dev` subdomain.
- Attaching the custom domains (`PUT /accounts/:id/workers/domains`).
- Creating the Access organization, application and policy (`POST
  /accounts/:id/access/organizations`, `/access/apps`, `/access/apps/:id/policies`).
- Creating the Hyperdrive config and `terraform import` of the Neon project.
- Setting GitHub secrets and the `production` environment.

A `scripts/setup-cloudflare-access.sh` would make the Access/domain wiring
reproducible. Until then, this file is the record.

## Outstanding

- Provision and verify a staff row for the actual Access identity before
  activating the new dashboard; the seed still uses an example email.
- Review/apply `db/migrations/0001_operator_workflow.sql` and verify an
  isolated restore before activating versioned request edits. Neither has
  happened in production.
- Rotate the Cloudflare API token and Neon key (both were shared in chat).
- Confirm `.ca` auto-renew.
- Custom-domain bootstrap for CI: `deploy-api.yml` relies on the custom domains
  already being attached, which they are.
