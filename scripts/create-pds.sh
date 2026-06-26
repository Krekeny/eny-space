#!/usr/bin/env bash
# Deploy a PDS directly on the backend infra — mirrors the webhook's /deploy call.
#
# Usage:
#   bash scripts/create-pds.sh <username> <email> [disksize-gb]
#     disksize-gb defaults to 1 (personal). community = 10, organization = 100.
#
# Reads PDS_API_BASE_URL / PDS_API_TOKEN / NEXT_PUBLIC_PDS_HOSTNAME_SUFFIX from
# .env.local. NOTE: this only creates the pod on the backend — it does NOT write
# a pds_services row, so the dashboard won't know about it (standalone PDS).
set -euo pipefail

cd "$(dirname "$0")/.."

username="${1:-}"
email="${2:-}"
disksize="${3:-1}"

if [ -z "$username" ] || [ -z "$email" ]; then
  echo "Usage: bash scripts/create-pds.sh <username> <email> [disksize-gb]" >&2
  exit 1
fi

base="$(grep -E '^PDS_API_BASE_URL=' .env.local | cut -d= -f2-)"
token="$(grep -E '^PDS_API_TOKEN=' .env.local | cut -d= -f2-)"
suffix="$(grep -E '^NEXT_PUBLIC_PDS_HOSTNAME_SUFFIX=' .env.local | cut -d= -f2-)"
suffix="${suffix:-.eny.space}"

if [ -z "$base" ] || [ -z "$token" ]; then
  echo "PDS_API_BASE_URL or PDS_API_TOKEN missing in .env.local" >&2
  exit 1
fi

hostname="${username}${suffix}"
password="$(openssl rand -hex 16)"

echo "About to deploy a PDS:"
echo "  username: $username"
echo "  hostname: $hostname"
echo "  email:    $email"
echo "  disksize: ${disksize} GB"
echo "  base:     $base"
printf 'Proceed? [y/N] '
read -r confirm
case "$confirm" in
  y | Y) ;;
  *) echo "Aborted."; exit 0 ;;
esac

echo "--- response ---"
curl -sS -X POST "$base/deploy" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d "{\"username\":\"$username\",\"password\":\"$password\",\"email\":\"$email\",\"hostname\":\"$hostname\",\"disksize\":$disksize}"
echo
echo "--- credentials (save these — not stored anywhere) ---"
echo "  hostname: $hostname"
echo "  password: $password"
