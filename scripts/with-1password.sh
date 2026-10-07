#!/usr/bin/env bash
# Inject Common Record secrets only from the explicitly selected personal
# 1Password account. This script never prints secret values.
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: COMMON_RECORD_OP_ACCOUNT=<personal-account-id> scripts/with-1password.sh neon|db|cloudflare command [args...]" >&2
  exit 2
fi
if [ -z "${COMMON_RECORD_OP_ACCOUNT:-}" ]; then
  echo "Set COMMON_RECORD_OP_ACCOUNT to the personally owned 1Password account ID; refusing the default account." >&2
  exit 2
fi
if [ -n "${OP_SERVICE_ACCOUNT_TOKEN:-}" ] || [ -n "${OP_CONNECT_TOKEN:-}" ]; then
  echo "Local runs must use the selected personal 1Password account, not an inherited automation token." >&2
  exit 2
fi
if ! command -v op >/dev/null 2>&1; then
  echo "1Password CLI (op) is required." >&2
  exit 2
fi

profile="$1"
shift
case "$profile" in
  neon|db|cloudflare) ;;
  *) echo "Unknown secret profile: $profile" >&2; exit 2 ;;
esac
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
env_file="$script_dir/../config/onepassword.$profile.env"
exec op --account "$COMMON_RECORD_OP_ACCOUNT" run --env-file="$env_file" -- "$@"
