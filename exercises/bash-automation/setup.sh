#!/usr/bin/env bash
#
# setup.sh — Server bootstrap & health-check automation
# Author: Patrick Thompson
#
# Idempotently prepares a fresh Ubuntu/Debian server and runs a set of
# health checks. Safe to run repeatedly. Logs everything to a timestamped
# file and returns a non-zero exit code if any health check fails so it can
# be wired into CI or a cron job.
#
# Usage:
#   sudo ./setup.sh                # bootstrap + health check
#   ./setup.sh --check-only        # health checks only (no install)
#
set -euo pipefail

# ----- Configuration -----
PACKAGES=(curl wget git htop ufw fail2ban unattended-upgrades)
DISK_THRESHOLD=85          # percent
LOG_DIR="/var/log/server-setup"
LOG_FILE="${LOG_DIR}/setup-$(date +%Y%m%d-%H%M%S).log"
SERVICES=(ssh cron)

CHECK_ONLY=false
[[ "${1:-}" == "--check-only" ]] && CHECK_ONLY=true

# ----- Helpers -----
mkdir -p "$LOG_DIR"
log()  { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }
ok()   { log "  OK   - $*"; }
warn() { log "  WARN - $*"; }
fail() { log "  FAIL - $*"; FAILURES=$((FAILURES + 1)); }

FAILURES=0

require_root() {
  if [[ "$EUID" -ne 0 ]]; then
    echo "This step needs root. Re-run with sudo." >&2
    exit 1
  fi
}

# ----- 1. Package bootstrap (idempotent) -----
bootstrap() {
  require_root
  log "Updating package index..."
  apt-get update -qq

  for pkg in "${PACKAGES[@]}"; do
    if dpkg -s "$pkg" >/dev/null 2>&1; then
      ok "$pkg already installed"
    else
      log "Installing $pkg..."
      apt-get install -y -qq "$pkg" && ok "$pkg installed"
    fi
  done

  # Basic firewall: allow SSH, deny the rest by default.
  if command -v ufw >/dev/null; then
    ufw allow OpenSSH >/dev/null 2>&1 || true
    ufw --force enable >/dev/null 2>&1 || true
    ok "firewall enabled (SSH allowed)"
  fi
}

# ----- 2. Log rotation config -----
configure_logrotate() {
  require_root
  cat > /etc/logrotate.d/app <<'EOF'
/var/log/app/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF
  ok "log rotation configured (14 days, compressed)"
}

# ----- 3. Health checks -----
check_disk() {
  local usage
  usage=$(df --output=pcent / | tail -1 | tr -dc '0-9')
  if (( usage >= DISK_THRESHOLD )); then
    fail "disk usage ${usage}% >= ${DISK_THRESHOLD}%"
  else
    ok "disk usage ${usage}%"
  fi
}

check_memory() {
  local avail
  avail=$(free -m | awk '/^Mem:/ {print $7}')
  if (( avail < 128 )); then
    warn "only ${avail}MB memory available"
  else
    ok "${avail}MB memory available"
  fi
}

check_services() {
  for svc in "${SERVICES[@]}"; do
    if systemctl is-active --quiet "$svc"; then
      ok "service '$svc' is running"
    else
      fail "service '$svc' is NOT running"
    fi
  done
}

check_connectivity() {
  if curl -fsS --max-time 5 https://aws.amazon.com >/dev/null; then
    ok "outbound HTTPS connectivity"
  else
    fail "no outbound HTTPS connectivity"
  fi
}

# ----- Main -----
log "=== Server setup & health check starting ==="
if ! $CHECK_ONLY; then
  bootstrap
  configure_logrotate
fi

log "Running health checks..."
check_disk
check_memory
check_services
check_connectivity

log "=== Done. ${FAILURES} failure(s). Log: ${LOG_FILE} ==="
exit $(( FAILURES > 0 ? 1 : 0 ))
