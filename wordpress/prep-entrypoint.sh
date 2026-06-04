#!/bin/bash
# Sagebrush WordPress — PREP/INIT entrypoint (runs in the custom prep image, as
# an initContainer; the serving container is the VANILLA wordpress image).
#
# Responsibility split (this is WordPress's own boundary):
#   • THEME / CODE  → owned by this prep job. We copy our theme (incl. the built
#     React bundle in site/), the vendored SQLite plugin, and the db.php drop-in
#     from the image onto the PVC every run, so a new image rolls out code.
#   • CONTENT       → owned by SQLite. The DB (wp-content/database/.ht.sqlite —
#     the editable copy, accounts) and uploads live on the PVC and are created
#     once at install, then owned by WordPress. We never rewrite them.
set -euo pipefail

WPC=/var/www/html/wp-content
SEED=/usr/src/sagebrush-seed
SITE_URL="${WORDPRESS_SITE_URL:-http://localhost:8094}"
ADMIN_USER="${WORDPRESS_ADMIN_USER:-admin}"
ADMIN_EMAIL="${WORDPRESS_ADMIN_EMAIL:-admin@sagebrushcycle.co}"

wp() { /usr/local/bin/wp --allow-root --path=/var/www/html "$@"; }

mkdir -p "$WPC/database" "$WPC/uploads" "$WPC/themes" "$WPC/plugins"

# ── Code: refresh from the image every run (never touches database/ or uploads/) ──
echo "[sagebrush] syncing theme + SQLite drop-in onto the volume"
rm -rf "$WPC/themes/sagebrush" "$WPC/plugins/sqlite-database-integration"
cp -a "$SEED/themes/sagebrush"                    "$WPC/themes/sagebrush"
cp -a "$SEED/plugins/sqlite-database-integration" "$WPC/plugins/sqlite-database-integration"
cp -a "$SEED/db.php"                              "$WPC/db.php"
# NB: deliberately NO wp-content/install.php — WordPress treats that path as an
# install-customization hook (required mid-upgrade.php, before wp_install_defaults
# is defined), which fatals wp-cli's installer. The db.php drop-in is the only
# special file we ship.

# ── Persistent auth salts (generated once) so logins survive pod restarts.
# Read by wp-config.php in BOTH the prep and serving containers. ──
if [ ! -f "$WPC/database/salts.php" ]; then
  echo "[sagebrush] generating persistent auth salts"
  {
    echo "<?php"
    for k in AUTH_KEY SECURE_AUTH_KEY LOGGED_IN_KEY NONCE_KEY \
             AUTH_SALT SECURE_AUTH_SALT LOGGED_IN_SALT NONCE_SALT; do
      printf "define('%s', '%s');\n" "$k" \
        "$(head -c 48 /dev/urandom | base64 | tr -d '\n=+/' | cut -c1-64)"
    done
  } > "$WPC/database/salts.php"
fi

# ── Content: install once into SQLite; never re-run if already installed. ──
if ! wp core is-installed >/dev/null 2>&1; then
  PW="${WORDPRESS_ADMIN_PASSWORD:-}"; GEN=
  if [ -z "$PW" ]; then PW="$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | cut -c1-20)"; GEN=1; fi
  echo "[sagebrush] installing WordPress (SQLite) at ${SITE_URL}"
  wp core install --url="$SITE_URL" --title="Sagebrush Cycle" \
    --admin_user="$ADMIN_USER" --admin_email="$ADMIN_EMAIL" \
    --admin_password="$PW" --skip-email
  [ -n "$GEN" ] && echo "[sagebrush] WORDPRESS_ADMIN_PASSWORD was unset — generated admin password: ${PW}"
else
  echo "[sagebrush] WordPress already installed on the volume — preserving content."
fi

# Idempotent settings + ensure our theme is active (cheap on every run).
wp option update home "$SITE_URL"      >/dev/null
wp option update siteurl "$SITE_URL"   >/dev/null
wp option update blogname "Sagebrush Cycle" >/dev/null
wp option update blogdescription "Bike rentals on the Weiser Trail" >/dev/null
wp theme activate sagebrush

chown -R www-data:www-data "$WPC"
echo "[sagebrush] prep complete — handing the volume to the vanilla WordPress container."
