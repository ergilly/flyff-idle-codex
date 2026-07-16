#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/flyff-idle}"
ENV_FILE="/etc/flyff-idle/api.env"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this command with sudo." >&2
  exit 1
fi

runuser -u flyff-idle -- env HOME=/home/flyff-idle git -C "${APP_DIR}" pull --ff-only

if [[ ! -f "${APP_DIR}/apps/api/data/game-data.db" ]]; then
  echo "${APP_DIR}/apps/api/data/game-data.db is missing after updating. Build and commit it before deploying." >&2
  exit 1
fi

runuser -u flyff-idle -- env HUSKY=0 HOME=/home/flyff-idle npm --prefix "${APP_DIR}" ci
runuser -u flyff-idle -- env NEXT_PUBLIC_API_URL= npm --prefix "${APP_DIR}" run build

if command -v restorecon >/dev/null 2>&1; then
  restorecon -R "${APP_DIR}/apps/web/out"
fi

set -a
source "${ENV_FILE}"
set +a
runuser -u flyff-idle -- env HOME=/home/flyff-idle npm --prefix "${APP_DIR}" run db:migrate -w @flyff-idle/api

systemctl restart flyff-idle-api
systemctl reload caddy
systemctl --no-pager --full status flyff-idle-api

for attempt in $(seq 1 10); do
  if curl --fail --silent --show-error http://127.0.0.1:4000/health >/dev/null; then
    echo "Deployment health check passed."
    exit 0
  fi

  if [[ "${attempt}" -eq 10 ]]; then
    echo "Deployment health check failed after 10 attempts." >&2
    journalctl --no-pager --unit flyff-idle-api --lines 50
    exit 1
  fi

  sleep 2
done
