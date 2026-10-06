#!/usr/bin/env bash
# Apply the Common Record schema to a PostgreSQL database.
#
# Usage:
#   scripts/apply-db-schema.sh "<connection-string>" [--seed]
#
# Works against local Postgres or Neon; the caller supplies the URI so no
# credential is ever read from or written to this repository. Schema is always
# applied; seed data is applied only with --seed.
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "usage: $0 \"<connection-string>\" [--seed]" >&2
  exit 2
fi

connection_string="$1"
shift

apply_seed=false
for argument in "$@"; do
  case "$argument" in
    --seed) apply_seed=true ;;
    *) echo "unknown argument: $argument" >&2; exit 2 ;;
  esac
done

if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Install the PostgreSQL client (for example: brew install libpq)." >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Applying db/schema.sql"
psql "$connection_string" -v ON_ERROR_STOP=1 -f "$repo_root/db/schema.sql"

if [ "$apply_seed" = true ]; then
  echo "Applying db/seed.sql"
  psql "$connection_string" -v ON_ERROR_STOP=1 -f "$repo_root/db/seed.sql"
  echo "Applied db/schema.sql and db/seed.sql"
else
  echo "Applied db/schema.sql (no seed; pass --seed to load pilot data)"
fi
