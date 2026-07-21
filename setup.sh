#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f package-lock.json ]]; then
  echo "package-lock.json is required for reproducible setup." >&2
  exit 1
fi

npm ci
echo "Dependencies installed. Copy .env.example to .env, set distinct secrets, then run migrations and bootstrap explicitly."
echo "  npm run db:migrate"
echo "  npm run admin:bootstrap"
echo "  npm run dev:server    # terminal 1"
echo "  npm run dev:web       # terminal 2"
