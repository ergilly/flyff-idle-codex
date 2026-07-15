#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/flyff-idle}"
SITE_ADDRESS="${1:-}"
INITIAL_TEST_PASSWORD="${2:-$(tr -d '-' </proc/sys/kernel/random/uuid | cut -c1-24)}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer with sudo." >&2
  exit 1
fi

if [[ -z "${SITE_ADDRESS}" || ! "${SITE_ADDRESS}" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "Usage: sudo bash ./deploy/ubuntu/install.sh your-domain.example [test-password]" >&2
  exit 1
fi

if [[ ! "${INITIAL_TEST_PASSWORD}" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "The optional test password may contain letters, numbers, dots, underscores, and hyphens." >&2
  exit 1
fi

if [[ "$(realpath "${SCRIPT_DIR}/../..")" != "$(realpath "${APP_DIR}")" ]]; then
  echo "Clone the repository at ${APP_DIR}, then run this installer from that checkout." >&2
  exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y apt-transport-https ca-certificates curl debian-archive-keyring debian-keyring git gnupg openssl ufw

  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs

  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    > /etc/apt/sources.list.d/caddy-stable.list
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
elif command -v dnf >/dev/null 2>&1; then
  dnf install -y ca-certificates curl dnf-plugins-core firewalld git openssl policycoreutils-python-utils

  curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
  dnf install -y nodejs

  dnf copr enable -y @caddy/caddy
  dnf install -y caddy
else
  echo "Unsupported Linux distribution: apt-get or dnf is required." >&2
  exit 1
fi

if ! id flyff-idle >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /home/flyff-idle --shell /usr/sbin/nologin flyff-idle
fi

mkdir -p /etc/flyff-idle /var/lib/flyff-idle
chown -R flyff-idle:flyff-idle "${APP_DIR}" /var/lib/flyff-idle
chmod 750 /var/lib/flyff-idle

if [[ ! -f /etc/flyff-idle/api.env ]]; then
  cat > /etc/flyff-idle/api.env <<EOF
NODE_ENV=production
PORT=4000
JWT_SECRET=$(openssl rand -hex 32)
DATABASE_URL=file:/var/lib/flyff-idle/app.db
GAME_DATA_DATABASE_URL=file:${APP_DIR}/apps/api/data/game-data.db
TEST_ACCOUNT_PASSWORD=${INITIAL_TEST_PASSWORD}
EOF
  chmod 600 /etc/flyff-idle/api.env
fi

if [[ "$(swapon --show --noheadings | wc -l)" -eq 0 && ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

sed -e "s|__APP_DIR__|${APP_DIR}|g" \
  "${SCRIPT_DIR}/flyff-idle-api.service.template" > /etc/systemd/system/flyff-idle-api.service
sed -e "s|__APP_DIR__|${APP_DIR}|g" -e "s|__SITE_ADDRESS__|${SITE_ADDRESS}|g" \
  "${SCRIPT_DIR}/Caddyfile.template" > /etc/caddy/Caddyfile

install -m 0755 "${SCRIPT_DIR}/deploy.sh" /usr/local/sbin/flyff-idle-deploy
install -m 0755 "${SCRIPT_DIR}/reset-test-accounts.sh" /usr/local/sbin/flyff-idle-reset-test-accounts

runuser -u flyff-idle -- env HUSKY=0 HOME=/home/flyff-idle npm --prefix "${APP_DIR}" ci
runuser -u flyff-idle -- env NEXT_PUBLIC_API_URL= npm --prefix "${APP_DIR}" run build

set -a
source /etc/flyff-idle/api.env
set +a
runuser -u flyff-idle -- env HOME=/home/flyff-idle npm --prefix "${APP_DIR}" run db:migrate -w @flyff-idle/api

if [[ ! -f /var/lib/flyff-idle/app.db.seeded ]]; then
  runuser -u flyff-idle -- node "${APP_DIR}/apps/api/dist/data/resetTestAccounts.js"
  touch /var/lib/flyff-idle/app.db.seeded
  chown flyff-idle:flyff-idle /var/lib/flyff-idle/app.db.seeded
fi

systemctl daemon-reload
systemctl enable --now flyff-idle-api caddy
systemctl restart flyff-idle-api caddy

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
elif command -v firewall-cmd >/dev/null 2>&1; then
  if systemctl is-active --quiet firewalld; then
    firewall-cmd --add-service=http
    firewall-cmd --add-service=https
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
  else
    echo "firewalld is inactive; leaving the existing firewall state unchanged."
  fi
fi

if command -v semanage >/dev/null 2>&1; then
  semanage fcontext -a -t httpd_sys_content_t "${APP_DIR}/apps/web/out(/.*)?" 2>/dev/null \
    || semanage fcontext -m -t httpd_sys_content_t "${APP_DIR}/apps/web/out(/.*)?"
  restorecon -R "${APP_DIR}/apps/web/out"
  setsebool -P httpd_can_network_connect 1
  systemctl restart caddy
fi

echo "Flyff Idle is installed at https://${SITE_ADDRESS}"
echo "Seeded test account password: ${TEST_ACCOUNT_PASSWORD}"
echo "Reset only the seeded accounts with: sudo flyff-idle-reset-test-accounts"
