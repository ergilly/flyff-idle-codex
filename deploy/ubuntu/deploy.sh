#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/flyff-idle}"
ENV_FILE="/etc/flyff-idle/api.env"
SITE_ADDRESS_FILE="/etc/flyff-idle/site-address"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this command with sudo." >&2
  exit 1
fi

APP_DIR="$(realpath "${APP_DIR}")"

if [[ "${APP_DIR}" == "/" || ! -d "${APP_DIR}/.git" ]]; then
  echo "Refusing to deploy from invalid checkout: ${APP_DIR}" >&2
  exit 1
fi

# Git and npm run as the service account. Repair ownership left by any prior
# root-level maintenance before asking that account to update the checkout.
chown -R flyff-idle:flyff-idle "${APP_DIR}"

# The production checkout is disposable; persistent databases and secrets live
# outside APP_DIR. Resetting avoids partial pulls or server-side edits blocking
# a release and guarantees that the deployed tree exactly matches main.
runuser -u flyff-idle -- env HOME=/home/flyff-idle git -C "${APP_DIR}" fetch origin main
runuser -u flyff-idle -- env HOME=/home/flyff-idle git -C "${APP_DIR}" reset --hard origin/main
runuser -u flyff-idle -- env HOME=/home/flyff-idle git -C "${APP_DIR}" clean -fd

if [[ ! -f "${APP_DIR}/apps/api/data/game-data.db" ]]; then
  echo "${APP_DIR}/apps/api/data/game-data.db is missing after updating. Build and commit it before deploying." >&2
  exit 1
fi

runuser -u flyff-idle -- env HUSKY=0 HOME=/home/flyff-idle npm --prefix "${APP_DIR}" ci
runuser -u flyff-idle -- env NEXT_PUBLIC_API_URL= npm --prefix "${APP_DIR}" run build

SITE_ADDRESS=""

if [[ -f "${SITE_ADDRESS_FILE}" ]]; then
  SITE_ADDRESS="$(sed -e 's/\r$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' "${SITE_ADDRESS_FILE}")"
fi

if [[ ! "${SITE_ADDRESS}" =~ ^(https?://)?[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  SITE_ADDRESS="$(
    awk '
      {
        if ($0 !~ /^[^[:space:]#].*\{[[:space:]]*$/) {
          next
        }
        line = $0
        sub(/^[[:space:]]*/, "", line)
        sub(/[[:space:]]*\{[[:space:]]*$/, "", line)
        if (line ~ /^(https?:\/\/)?[A-Za-z0-9.-]+(:[0-9]+)?$/) {
          print line
          exit
        }
      }
    ' /etc/caddy/Caddyfile 2>/dev/null || true
  )"
fi

if [[ "${SITE_ADDRESS}" =~ ^(https?://)?[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  printf '%s\n' "${SITE_ADDRESS}" > "${SITE_ADDRESS_FILE}"
  chmod 600 "${SITE_ADDRESS_FILE}"

  CADDY_CONFIG="$(mktemp /etc/caddy/Caddyfile.XXXXXX)"
  trap 'rm -f "${CADDY_CONFIG}"' EXIT
  sed -e "s|__APP_DIR__|${APP_DIR}|g" -e "s|__SITE_ADDRESS__|${SITE_ADDRESS}|g" \
    "${APP_DIR}/deploy/ubuntu/Caddyfile.template" > "${CADDY_CONFIG}"
  caddy validate --config "${CADDY_CONFIG}"
  install -m 0644 "${CADDY_CONFIG}" /etc/caddy/Caddyfile
  rm -f "${CADDY_CONFIG}"
  trap - EXIT
else
  echo "Warning: unable to determine the configured site address; preserving the current Caddyfile." >&2
fi

if command -v restorecon >/dev/null 2>&1; then
  restorecon -R "${APP_DIR}/apps/web/out"
fi

set -a
source "${ENV_FILE}"
set +a
runuser -u flyff-idle -- env HOME=/home/flyff-idle npm --prefix "${APP_DIR}" run db:migrate -w @flyff-idle/api

install -m 0755 "${APP_DIR}/deploy/ubuntu/deploy.sh" /usr/local/sbin/flyff-idle-deploy
install -m 0755 "${APP_DIR}/deploy/ubuntu/reset-test-accounts.sh" /usr/local/sbin/flyff-idle-reset-test-accounts

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
