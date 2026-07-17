#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/flyff-idle}"
ENV_FILE="/etc/flyff-idle/api.env"
SITE_ADDRESS_FILE="/etc/flyff-idle/site-address"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this command with sudo." >&2
  exit 1
fi

# Git and npm run as the service account. Repair ownership left by any prior
# root-level maintenance before asking that account to update the checkout.
chown -R flyff-idle:flyff-idle "${APP_DIR}"

runuser -u flyff-idle -- env HOME=/home/flyff-idle git -C "${APP_DIR}" pull --ff-only

if [[ ! -f "${APP_DIR}/apps/api/data/game-data.db" ]]; then
  echo "${APP_DIR}/apps/api/data/game-data.db is missing after updating. Build and commit it before deploying." >&2
  exit 1
fi

runuser -u flyff-idle -- env HUSKY=0 HOME=/home/flyff-idle npm --prefix "${APP_DIR}" ci
runuser -u flyff-idle -- env NEXT_PUBLIC_API_URL= npm --prefix "${APP_DIR}" run build

if [[ -f "${SITE_ADDRESS_FILE}" ]]; then
  SITE_ADDRESS="$(<"${SITE_ADDRESS_FILE}")"
else
  SITE_ADDRESS="$(sed -n '1{s/[[:space:]]*{$//;s/[[:space:]]*$//;p;}' /etc/caddy/Caddyfile)"
fi

if [[ -z "${SITE_ADDRESS}" || ! "${SITE_ADDRESS}" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "Unable to determine the configured site address." >&2
  exit 1
fi

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
