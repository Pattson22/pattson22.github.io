# Bash Automation — Server Bootstrap & Health Checks

A single idempotent Bash script (`setup.sh`) that prepares a fresh
Ubuntu/Debian server and then runs a series of health checks. It is the kind
of small automation that removes repetitive manual work and gives an early,
machine-readable signal when something is wrong.

## What it does

**Bootstrap (run as root):**
- Updates the package index and installs a base toolset (`curl`, `git`, `htop`, `ufw`, `fail2ban`, `unattended-upgrades`) — only if each package is missing, so it is safe to re-run.
- Enables a minimal firewall (allow SSH, deny everything else by default).
- Drops in a `logrotate` policy so application logs rotate daily, stay compressed, and are pruned after 14 days.

**Health checks (run on every invocation):**
- Disk usage against a configurable threshold (default 85%).
- Available memory.
- Whether key services (`ssh`, `cron`) are active.
- Outbound HTTPS connectivity.

Every action is written to a timestamped log under `/var/log/server-setup/`,
and the script exits with a **non-zero status if any check fails** — so it
plugs straight into a cron job or a CI pipeline.

## How to run

```bash
chmod +x setup.sh

# Full bootstrap + health check (needs root)
sudo ./setup.sh

# Health checks only, no installation
./setup.sh --check-only
```

## Design choices

- `set -euo pipefail` so the script fails fast instead of limping along after an error.
- **Idempotency:** every install is guarded by a `dpkg -s` check, so running it ten times is identical to running it once.
- **Exit codes over noise:** the script counts failures and returns `1` if any check fails, which is what an automated system actually needs.

## What I learned

Writing automation that is *safe to re-run* is harder — and more valuable —
than writing a script that works once. Guarding every side effect and
returning a meaningful exit code turns a throwaway script into something you
can trust in a pipeline.
