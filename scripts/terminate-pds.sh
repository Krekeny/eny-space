#!/usr/bin/env bash
# Schedule a PDS service for termination on the backend infra.
#
# Usage:
#   bash scripts/terminate-pds.sh <service-id> [minutes-from-now]
#     minutes-from-now defaults to 5; use 0 for immediate.
#
# Reads PDS_API_BASE_URL / PDS_API_TOKEN from .env.local at runtime
# (no secrets are stored in this file).
set -euo pipefail

cd "$(dirname "$0")/.."

service_id="${1:-}"
minutes="${2:-5}"

if [ -z "$service_id" ]; then
  echo "Usage: bash scripts/terminate-pds.sh <service-id> [minutes-from-now]" >&2
  exit 1
fi

base="$(grep -E '^PDS_API_BASE_URL=' .env.local | cut -d= -f2-)"
token="$(grep -E '^PDS_API_TOKEN=' .env.local | cut -d= -f2-)"

if [ -z "$base" ] || [ -z "$token" ]; then
  echo "PDS_API_BASE_URL or PDS_API_TOKEN missing in .env.local" >&2
  exit 1
fi

when="$(date -u -v+"${minutes}"M '+%Y-%m-%dT%H:%M:%S.000Z')"

echo "About to schedule termination:"
echo "  service: $service_id"
echo "  base:    $base"
echo "  when:    $when  (now + ${minutes} min)"
printf 'Proceed? [y/N] '
read -r confirm
case "$confirm" in
  y | Y) ;;
  *) echo "Aborted."; exit 0 ;;
esac

echo "--- response ---"
curl -sS -X DELETE "$base/service/$service_id" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d "{\"termination_date\":\"$when\"}"
echo
