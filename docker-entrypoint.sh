#!/bin/sh
set -eu

# Write the runtime config from the container environment so no env value is
# baked into the built bundle. Regenerated on every container start.
CONFIG_PATH="/usr/share/nginx/html/config.js"

cat > "$CONFIG_PATH" <<EOF
window.__ENV__ = {
  SEED_DEMO: "${SEED_DEMO:-false}",
  SENTRY_DSN: "${SENTRY_DSN:-}",
  UMAMI_URL: "${UMAMI_URL:-}",
  UMAMI_WEBSITE_ID: "${UMAMI_WEBSITE_ID:-}"
};
EOF

exec nginx -g 'daemon off;'
