#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/flyff-idle}"
ENV_FILE="/etc/flyff-idle/api.env"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this command with sudo." >&2
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

runuser -u flyff-idle -- node "${APP_DIR}/apps/api/dist/data/resetTestAccounts.js"
