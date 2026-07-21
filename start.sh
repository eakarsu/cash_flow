#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"

if [[ -d /opt/homebrew/opt/node@24/bin ]]; then
  export PATH="/opt/homebrew/opt/node@24/bin:$PATH"
fi

# The runtime harness supplies a dedicated database path. Provisioning is
# limited to that isolated test database; normal startup never creates users.
if [[ "${NODE_ENV:-}" == "test" && -n "${DB_PATH:-}" ]]; then
  case "$DB_PATH" in
    /*) ;;
    *) echo "DB_PATH must be absolute in test mode" >&2; exit 1 ;;
  esac
  export LEDGER_DATABASE_PATH="$DB_PATH"
  npm run db:migrate
  if [[ -n "${ADMIN_EMAIL:-}" && -n "${ADMIN_PASSWORD:-}" ]]; then
    BOOTSTRAP_EMAIL="$ADMIN_EMAIL" \
      BOOTSTRAP_PASSWORD="$ADMIN_PASSWORD" \
      BOOTSTRAP_ROLE=operator \
      npm run admin:bootstrap
  fi
fi

exec node --import tsx server.ts
