# Common Record secrets and infrastructure setup

Status: repository-side preparation only. No 1Password item, HCP workspace,
Neon resource, Cloudflare resource, GitHub secret, Terraform state, or
production database row was created or changed by this setup.

## Account boundary

Common Record belongs in a personally owned 1Password account, **not** Tim's
employer-owned work account. 1Password supports multiple accounts in the same
desktop app. If the employer offers a linked Families subscription, it is a
separate personal account; confirm ownership and the ability to retain it
after leaving before using it. Never send the account password, Secret Key,
service-account token, API tokens, or database password in chat or a PR.

Create two vaults, `CommonRecordInfra` and `CommonRecordDeploy`, in the personal account. The tracked
files in `config/onepassword.*.env` contain **references only**, not values.
Create these items and fields in their respective vaults:

| Vault / item | Fields | Purpose |
| --- | --- | --- |
| `CommonRecordInfra/neon-api` | `api-key` | Neon project-scoped API key if its permissions suffice for the existing Terraform project; use a narrowly scoped organization key only if required. |
| `CommonRecordInfra/neon-production-db` | `terraform-direct-uri`, `host`, `database`, `migration-user`, `migration-password` | Direct Terraform backend URI and a separate migration credential. Do not use the Hyperdrive pooled URI for Terraform state or migrations. |
| `CommonRecordDeploy/cloudflare-deploy` | `api-token` | Cloudflare token limited to the Worker resources needed by deployment. |

Keep the 1Password CI service-account token in a separate personal-only vault,
not in a vault it can read. Grant the CI service account read access only to
the `CommonRecordDeploy` vault; use a second identity for
database migrations if they are automated. The bootstrap token will be the
**only** long-lived GitHub environment secret for the 1Password integration.
The current GitHub Cloudflare token remains until the new path is tested, then
it should be revoked and removed. Runtime copies in Cloudflare Worker secrets
and Hyperdrive remain necessary; 1Password is the authoritative inventory,
not a replacement for those runtime bindings.

## Local use

The installed `op` CLI is available. Set `COMMON_RECORD_OP_ACCOUNT` to the
personal account **ID** or sign-in address in your own shell. The wrapper
refuses to guess an account, so it cannot silently use the work login. For
example, after creating the personal vault items:

```bash
COMMON_RECORD_OP_ACCOUNT=<personal-account-id> scripts/with-1password.sh neon terraform -chdir=infra/neon plan
COMMON_RECORD_OP_ACCOUNT=<personal-account-id> scripts/with-1password.sh db psql -X -v ON_ERROR_STOP=1 -c 'select current_database(), current_user'
```

The first command is a **plan**, not an apply. The second is read-only. Avoid
passing credentials in command arguments or writing a resolved `.env` file.
Each profile injects only its own secret set; `op run` masks resolved values
in subprocess output by default. Do not use `--no-masking`.

## Independent Terraform state

The current Neon Terraform configuration already declares the imported Neon
project, but its `pg` backend stores state in the same production database.
That ties infrastructure recovery to application-database recovery and may
retain connection URIs in state. The recommended target is a personal HCP
Terraform organization and a `common-record-neon-production` workspace,
configured for **local execution** so the Neon API key stays in the local
1Password session, with state access limited to the operator. `infra/neon/hcp-cloud.tf.example`
is a **template**, not an active backend.

Before any migration: provision the independent workspace; confirm the
account, workspace, state encryption, permissions, and a recoverable encrypted
copy of the existing state; read the live Neon project/branch IDs; run a
no-change Terraform plan; then present the exact state move for approval.
Remove the `pg` backend only as part of that controlled move. Run
`terraform init -migrate-state` once, verify the HCP state lineage and a
no-change plan, and do not delete the old state until recovery is demonstrated.
Changing the backend is **not** the same as changing the Neon project.

Terraform manages Neon project/branch settings. SQL schema migrations remain
separate, checksum-reviewed transactions tested on an isolated Neon branch.
The pending `0001_operator_workflow.sql` production migration and staff-row
provisioning are not authorized by this setup file. Cloudflare Access and
Hyperdrive were created manually; import them into a separately scoped
Cloudflare Terraform state only after fetching their exact live configuration
and obtaining a no-change plan. In particular, replacing the Access app may
change the audience that the Worker validates.

## CI cutover

After the personal 1Password account and CI service account exist:

1. Store `OP_SERVICE_ACCOUNT_TOKEN` in GitHub's protected `production`
   environment, not in the repository. The service account must see only the
   deployment vault.
2. The Worker deploy workflow is prepared to load `CLOUDFLARE_API_TOKEN` from
   `op://CommonRecordDeploy/cloudflare-deploy/api-token` using the official
   `1password/load-secrets-action` when that bootstrap token exists. Until then
   it uses the existing GitHub Cloudflare secret. Keep that fallback until one
   approved deployment succeeds with 1Password.
3. Rotate the previously shared Cloudflare API token, revoke the old GitHub
   secret, and confirm the next protected deployment succeeds. Rotate the
   Neon API key and database credential separately, with Hyperdrive cutover
   and a rollback plan.

No workflow should print secret values, pass them on a command line, or write
them into a Terraform variable file. GitHub environment approval protects
deployment, but it does not substitute for least-privilege credentials.
