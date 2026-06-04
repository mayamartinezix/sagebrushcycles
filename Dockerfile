# Sagebrush Cycle — WordPress (SQLite) variant (cms/wordpress branch).
#
# This builds the PREP/INIT image only. The SERVING container is the unmodified
# upstream `wordpress` image (see deploy/deployment.yaml) — we deliberately do
# NOT bake a custom server, so WordPress upgrades by bumping the vanilla tag.
# This image carries OUR code (theme + built React bundle + vendored SQLite
# plugin + db.php drop-in) and, run as an initContainer, preps the shared PVC:
# copies that code onto it and runs `wp core install` against SQLite. Content
# then lives in the SQLite DB on the PVC, owned by WordPress (see prep-entrypoint.sh).
#
# Target URL: https://weeeeeiserbikes-wordpress.staging.tripoli.systems/

# ── Stage 1: build the static React bundle ─────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
# /app/public now holds app.js, colors_and_type.css, site.css, assets/, fonts/
# (content.js is not used — WordPress injects window.SB_CONTENT from the theme).

# ── Stage 2: prep image (vanilla wordpress + wp-cli + our seed) ─────────────
FROM wordpress:6.7-php8.3-apache

ARG WP_CLI_VERSION=2.11.0

# Admin account is created at RUNTIME by the prep entrypoint from the injected
# WORDPRESS_ADMIN_PASSWORD (k8s: the wordpress-admin Secret, Vault
# kv/wordpress-admin). The default below only makes a bare local run usable.
ENV WORDPRESS_ADMIN_USER=admin \
    WORDPRESS_ADMIN_EMAIL=admin@sagebrushcycle.co \
    WORDPRESS_ADMIN_PASSWORD=ChangeMe-Sagebrush-Staging-2026! \
    WORDPRESS_SITE_URL=http://localhost:8094

# WP-CLI (the prep entrypoint installs WordPress with it; no wp-cli ships in the
# vanilla serving image, which is fine — it never installs).
RUN set -eux; \
    curl -fsSL -o /usr/local/bin/wp \
      "https://github.com/wp-cli/wp-cli/releases/download/v${WP_CLI_VERSION}/wp-cli-${WP_CLI_VERSION}.phar"; \
    chmod +x /usr/local/bin/wp; \
    wp --allow-root --version

# The vanilla image keeps WP core in /usr/src/wordpress and copies it to the
# docroot via ITS entrypoint. We override the entrypoint (prep), so populate the
# docroot at build time — wp-cli needs core present to run `core install`.
RUN set -eux; \
    cp -a /usr/src/wordpress/. /var/www/html/; \
    rm -f /var/www/html/wp-config-docker.php /var/www/html/wp-config-sample.php

# wp-config used by wp-cli here (and mounted into the serving container too, via
# a ConfigMap generated from this same file — single source of truth).
COPY deploy/wp-config.php /var/www/html/wp-config.php

# Seed: our code, staged for the prep entrypoint to copy onto the PVC.
COPY wordpress/theme/sagebrush/                    /usr/src/sagebrush-seed/themes/sagebrush/
COPY wordpress/plugin/sqlite-database-integration/ /usr/src/sagebrush-seed/plugins/sqlite-database-integration/
COPY wordpress/db.php                              /usr/src/sagebrush-seed/db.php
# The built static bundle goes into the seed theme's site/ dir (<base href> →
# /wp-content/themes/sagebrush/site/).
COPY --from=build /app/public/app.js              /usr/src/sagebrush-seed/themes/sagebrush/site/app.js
COPY --from=build /app/public/colors_and_type.css /usr/src/sagebrush-seed/themes/sagebrush/site/colors_and_type.css
COPY --from=build /app/public/site.css            /usr/src/sagebrush-seed/themes/sagebrush/site/site.css
COPY --from=build /app/public/assets              /usr/src/sagebrush-seed/themes/sagebrush/site/assets
COPY --from=build /app/public/fonts               /usr/src/sagebrush-seed/themes/sagebrush/site/fonts

COPY wordpress/prep-entrypoint.sh /usr/local/bin/sagebrush-prep.sh
RUN chmod +x /usr/local/bin/sagebrush-prep.sh

# Runs to completion (preps the PVC) and exits — it's an initContainer, not a server.
ENTRYPOINT ["/usr/local/bin/sagebrush-prep.sh"]
