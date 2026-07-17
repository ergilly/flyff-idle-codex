# Hosting Flyff Idle

The supplied deployment runs the static Next.js export, Express API, immutable game-data database, and
persistent player database on one Ubuntu or Oracle Linux VM. Caddy serves the frontend and provisions HTTPS,
while systemd keeps the API running.

## Storage layout

- `apps/api/data/game-data.db` is generated from `docs/json`, committed with the application, and opened
  read-only. It can be replaced on any deployment.
- `/var/lib/flyff-idle/app.db` stores players, characters, and inventories. It is outside the Git checkout and
  is never replaced by a deployment.
- `/etc/flyff-idle/api.env` contains the production JWT secret and database locations. The installer creates it
  once and preserves it during later deployments.

## Recommended free host: Oracle Cloud Always Free

Oracle's Always Free compute offering includes persistent boot storage and is large enough to build and run
this application. Availability can be limited in some regions, and Oracle can reclaim an idle Always Free
instance, so keep an occasional database backup outside the VM.

1. Commit and push the application, including `apps/api/data/game-data.db`.
2. Create an Ubuntu 24.04 or Oracle Linux 8 Always Free VM. An Ampere A1 shape with 1 OCPU and 6 GB RAM is
   sufficient.
3. Add your SSH public key during VM creation.
4. In the VM subnet security list, allow inbound TCP 80 and 443 from `0.0.0.0/0`. Restrict TCP 22 to your own
   IP address if possible.
5. Reserve the VM's public IP so its address does not change.
6. Connect over SSH and clone the repository at the required location:

   ```bash
   sudo apt-get update
   sudo apt-get install -y git
   sudo git clone https://github.com/ergilly/flyff-idle-codex.git /opt/flyff-idle
   cd /opt/flyff-idle
   ```

   For a private repository, configure a GitHub deploy key first instead of putting a personal token in shell
   history.

7. Choose a hostname. With no purchased domain, an address such as
   `203.0.113.10.sslip.io` resolves to the embedded IP for free. Replace the example with the VM's public IP.
8. Install the application:

   ```bash
   sudo bash ./deploy/ubuntu/install.sh YOUR_PUBLIC_IP.sslip.io
   ```

The installer adds a 2 GB swap file for builds, installs Node.js 24 and Caddy, creates the persistent database,
runs migrations, creates the test accounts once, enables the firewall, and starts both services. It generates
and prints a random test-account password. To choose one explicitly, provide it as a second argument. Visit the
HTTPS address printed at the end.

If you own a domain, point an `A` record at the reserved public IP and pass that domain to the installer instead.
Caddy obtains and renews its TLS certificate automatically.

## Deploying updates

Commit and push changes, then connect to the VM and run:

```bash
sudo flyff-idle-deploy
```

This resets the disposable application checkout to the latest `origin/main`, installs locked dependencies,
rebuilds the API and static frontend, runs non-destructive player database migrations, validates and installs the
latest Caddy configuration, and restarts the API. It also repairs checkout ownership before updating and refreshes
the installed deployment helpers. Player data and production secrets live outside the checkout, and deployment
deliberately does not seed the player database.

Older installations may not have `/etc/flyff-idle/site-address`. The first updated deployment recovers it from
the active Caddyfile and stores it for later releases. If the active configuration uses a custom layout that cannot
be recognized, deployment preserves that working Caddyfile and emits a warning instead of interrupting the release.

## Automatic deployment from GitHub

`.github/workflows/deploy-production.yml` verifies and deploys every push to `main`, including merged pull
requests. It can also be started manually from the Actions tab. The deploy job runs only after typechecking,
linting, unit tests, and a production build pass.

Create a dedicated SSH key for GitHub Actions. Add its public key to the VM user's
`~/.ssh/authorized_keys`, then create a GitHub environment named `production` under **Repository settings →
Environments**. Add these environment secrets:

- `PRODUCTION_HOST`: the VM's public IP, such as `132.226.209.192`.
- `PRODUCTION_USER`: the SSH login user, normally `opc` on Oracle Linux or `ubuntu` on Ubuntu.
- `PRODUCTION_SSH_PRIVATE_KEY`: the complete private key, including its BEGIN and END lines.
- `PRODUCTION_SSH_KNOWN_HOSTS`: the VM's trusted SSH host-key line.

Obtain the host-key material directly from the already authenticated VM instead of accepting an unverified
`ssh-keyscan` result:

```bash
sudo cat /etc/ssh/ssh_host_ed25519_key.pub
```

If that outputs `ssh-ed25519 AAAA...`, set `PRODUCTION_SSH_KNOWN_HOSTS` to:

```text
132.226.209.192 ssh-ed25519 AAAA...
```

The SSH user must be able to run `sudo` non-interactively. Verify this on the VM with `sudo -n true`. The
`flyff-idle` service user also needs its read-only GitHub deploy key because `flyff-idle-deploy` performs the
Git pull under that account.

The Oracle VCN security list or network security group must permit the GitHub-hosted runner to reach TCP 22.
GitHub runner addresses change over time; allowing SSH from the internet with key-only authentication is the
simplest configuration. A self-hosted runner or private overlay network is preferable if SSH must remain
restricted to fixed source addresses.

## Resetting test accounts in production

Run this over SSH:

```bash
sudo flyff-idle-reset-test-accounts
```

The operation is transactional. It resets only these accounts and leaves every other player untouched:

- `test@flyff-idle.local`
- `thirdjobs@flyff-idle.local`
- `secondjobs@flyff-idle.local`
- `empty@flyff-idle.local`

Their password comes from `TEST_ACCOUNT_PASSWORD` in `/etc/flyff-idle/api.env`. If you edit that value, run the
reset command once to apply the new password hash to the four accounts.

## Updating game reference data

After changing the ignored source files under `docs/json`, regenerate the deployable database locally:

```bash
npm run game-data:build
```

Commit the changed `apps/api/data/game-data.db`, push it, and run `sudo flyff-idle-deploy` on the VM. Replacing
this read-only file does not affect player data.

## Backups

At minimum, periodically stop the API, copy the player database off the VM, and start it again:

```bash
sudo systemctl stop flyff-idle-api
sudo cp /var/lib/flyff-idle/app.db /home/ubuntu/app-backup.db
sudo systemctl start flyff-idle-api
sudo chown ubuntu:ubuntu /home/ubuntu/app-backup.db
```

Then download `app-backup.db` with `scp`. Stopping the API ensures the SQLite database and its WAL are captured
consistently.

## Other Ubuntu hosts

The scripts work on fresh Ubuntu (`apt`/`ufw`) and Oracle Linux or RHEL-family (`dnf`/`firewalld`/SELinux) VMs
with a public IP, persistent filesystem, and inbound ports 22, 80, and 443. Some nominally free VM providers
charge separately for public IPv4 or erase local disks, so verify those details before choosing one.
