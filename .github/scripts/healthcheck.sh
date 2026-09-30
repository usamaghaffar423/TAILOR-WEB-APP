#!/usr/bin/env bash
# Post-deploy health check, run ON THE SERVER over SSH.
#
# The GitHub runner's probe is only advisory: datacenter IPs are refused with
# 403 by the host's bot protection, which says nothing about the app. This
# check goes through the real vhost, PHP-FPM and MySQL from the host itself,
# so a broken deploy fails the run even when the runner cannot reach the site.
#
# Required environment (passed by the workflow on the ssh stdin stream):
#   HEALTHCHECK_URL  absolute URL of the JSON health endpoint
#
# Exits 0 only for a 200 whose body contains "status":"ok".

set -euo pipefail

url="${HEALTHCHECK_URL:?HEALTHCHECK_URL is required}"

log() { printf '\033[1;34m[health]\033[0m %s\n' "$*"; }

for attempt in 1 2 3 4 5; do
  sleep 5
  if body="$(curl -fsS -A 'Mozilla/5.0 (compatible; deploy-healthcheck)' \
             --max-time 20 "$url" 2>&1)"; then
    if echo "$body" | grep -q '"status":"ok"'; then
      log "API healthy after deploy: $body"
      exit 0
    fi
    log "attempt $attempt: unexpected body: $body"
  else
    log "attempt $attempt: request failed: $body"
  fi
done

echo "[health] API did not report healthy after 5 attempts" >&2
exit 1
