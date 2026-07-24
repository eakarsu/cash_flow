#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$project_dir/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$project_dir/.env"
  set +a
fi
export API_PORT="${API_PORT:-${BACKEND_PORT:-}}"
export UI_PORT="${UI_PORT:-${FRONTEND_PORT:-}}"
export LEDGER_DATABASE_PATH="${LEDGER_DATABASE_PATH:-${DB_PATH:-}}"

required() { [[ -n "${!1:-}" ]] || { echo "$1 is required" >&2; exit 1; }; }
configuration() {
  for key in LEDGER_DATABASE_PATH API_PORT UI_PORT OPERATOR_API_TOKEN AUDITOR_API_TOKEN PROVIDER_WEBHOOK_SECRET IDENTITY_HASH_SECRET OPENROUTER_API_KEY OPENROUTER_MODEL OPENROUTER_BASE_URL ADMIN_EMAIL ADMIN_PASSWORD; do required "$key"; done
  [[ "$API_PORT" != "$UI_PORT" ]] || { echo 'API_PORT and UI_PORT must differ' >&2; exit 1; }
  [[ "$LEDGER_DATABASE_PATH" == /* ]] || { echo 'LEDGER_DATABASE_PATH must be absolute' >&2; exit 1; }
}
start_services() {
  npm --prefix "$project_dir" run db:migrate
  BOOTSTRAP_EMAIL="$ADMIN_EMAIL" BOOTSTRAP_PASSWORD="$ADMIN_PASSWORD" BOOTSTRAP_ROLE=operator node --import tsx "$project_dir/scripts/ensure-runtime-user.ts"
  cleanup() {
    trap - INT TERM EXIT
    [[ -z "${frontend_pid:-}" ]] || kill "$frontend_pid" 2>/dev/null || true
    [[ -z "${backend_pid:-}" ]] || kill "$backend_pid" 2>/dev/null || true
    [[ -z "${frontend_pid:-}" ]] || wait "$frontend_pid" 2>/dev/null || true
    [[ -z "${backend_pid:-}" ]] || wait "$backend_pid" 2>/dev/null || true
  }
  trap cleanup INT TERM EXIT
  PORT="$API_PORT" PUBLIC_APP_URL="http://127.0.0.1:$UI_PORT" node --import tsx "$project_dir/server.ts" &
  backend_pid=$!
  VITE_API_TARGET="http://127.0.0.1:$API_PORT" npm --prefix "$project_dir" run dev:web -- --port "$UI_PORT" --strictPort &
  frontend_pid=$!
  wait "$backend_pid" "$frontend_pid"
}

case "${1:-start}" in
  check) npm --prefix "$project_dir" run typecheck && npm --prefix "$project_dir" run lint && (cd "$project_dir" && npx --no-install vitest run --no-file-parallelism) && npm --prefix "$project_dir" run build ;;
  migrate) configuration; npm --prefix "$project_dir" run db:migrate ;;
  start) configuration; start_services ;;
  *) echo 'usage: ./start.sh [check|migrate|start]' >&2; exit 2 ;;
esac
