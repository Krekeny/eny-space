#!/usr/bin/env bash
# Poll the PDS lifecycle cron locally, like Vercel Cron would.
# Usage: bash scripts/cron-local.sh [interval-seconds]   (default 30)
set -euo pipefail

cd "$(dirname "$0")/.."

interval="${1:-30}"
url="http://localhost:3000/api/cron/pds-lifecycle"
secret="$(grep -E '^CRON_SECRET=' .env.local | cut -d= -f2-)"

if [ -z "$secret" ]; then
  echo "CRON_SECRET not found in .env.local" >&2
  exit 1
fi

echo "Polling $url every ${interval}s — Ctrl-C to stop"
while true; do
  printf '%s  ' "$(date +%T)"
  curl -s -H "Authorization: Bearer $secret" "$url"
  printf '\n'
  sleep "$interval"
done
