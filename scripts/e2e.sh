#!/usr/bin/env bash
set -euo pipefail
# Run the Playwright e2e suite inside the official container whose tag matches
# the pinned @playwright/test version. This app has no database.
# PW_VERSION MUST equal the @playwright/test version npm ci installs (pinned
# exact in web/package.json). Bump both in lockstep.
PW_VERSION="1.61.1"
# Run-scoped port so concurrent runs on a shared host never fight over one.
E2E_PORT="${E2E_PORT:-$((3100 + RANDOM % 800))}"
cd "$(dirname "$0")/.."
# --user: run as the host user, never root, so npm ci leaves no root-owned
# files on the bind mount. HOME/npm cache go to /tmp (the host uid has no home
# inside the image).
docker run --rm --init --ipc=host --network host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e npm_config_cache=/tmp/.npm \
  -e CI=1 -e E2E_PORT="$E2E_PORT" -v "$PWD":/work -w /work/web \
  "mcr.microsoft.com/playwright:v${PW_VERSION}-noble" \
  sh -c 'npm ci && npm run test:e2e'
