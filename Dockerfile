# Sagebrush Cycle — Grav CMS variant (cms/grav branch).
#
# Two stages:
#   1. node:22-alpine builds the static React-on-globals bundle from src/ into
#      /app/public (same build.mjs as the static variant — app.js is
#      content-free and reads window.SB_CONTENT at runtime).
#   2. php:8.3-apache installs a pinned Grav + Admin plugin, drops in the custom
#      `sagebrush` theme + home page (content in its frontmatter), and copies
#      the built static assets into the theme's site/ dir. The theme template
#      injects window.SB_CONTENT from the page header, so editing the page in
#      Grav admin (/admin) changes the rendered site.
#
# Target URL: https://weeeeeiserbikes-grav.staging.tripoli.systems/

# ── Stage 1: build the static bundle ───────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
# /app/public now holds: app.js, colors_and_type.css, site.css, assets/, fonts/
# (we do NOT use the generated content.js — Grav injects SB_CONTENT itself).

# ── Stage 2: Grav on php:8.3-apache ─────────────────────────────────────────
FROM php:8.3-apache

# Pinned Grav release (stable 1.7 line). Bump deliberately.
ARG GRAV_VERSION=1.7.52

# Admin account settings. The account is created at RUNTIME by the entrypoint
# (not baked into the image), so the password lives only in the injected env.
# In k8s, GRAV_ADMIN_PASSWORD comes from the grav-admin Secret (Vault
# kv/grav-admin) and overrides this default; the default below only makes a
# bare `docker run` usable locally.
ENV GRAV_ADMIN_USER=admin \
    GRAV_ADMIN_EMAIL=admin@sagebrushcycle.co \
    GRAV_ADMIN_PASSWORD=ChangeMe-Sagebrush-Staging-2026! \
    GRAV_ADMIN_FULLNAME="Sagebrush Admin"

# System libs + PHP extensions Grav needs (gd, zip), plus opcache for perf.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      libzip-dev libpng-dev libjpeg-dev libfreetype6-dev unzip ca-certificates; \
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    docker-php-ext-install -j"$(nproc)" gd zip opcache; \
    a2enmod rewrite headers; \
    rm -rf /var/lib/apt/lists/*

# Apache: serve Grav from /var/www/html, allow .htaccess overrides (Grav ships
# its own .htaccess with the security/rewrite rules), quiet the FQDN warning.
RUN set -eux; \
    sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf; \
    printf 'ServerName localhost\n' >> /etc/apache2/apache2.conf

# Fetch + unpack the pinned Grav + Admin bundle.
RUN set -eux; \
    curl -fsSL -o /tmp/grav.zip \
      "https://github.com/getgrav/grav/releases/download/${GRAV_VERSION}/grav-admin-v${GRAV_VERSION}.zip"; \
    unzip -q /tmp/grav.zip -d /tmp/grav; \
    rm -f /tmp/grav.zip; \
    rm -rf /var/www/html; \
    mv /tmp/grav/grav-admin /var/www/html

WORKDIR /var/www/html

# Custom theme + home page + config overrides.
COPY grav/theme/sagebrush/ /var/www/html/user/themes/sagebrush/
COPY grav/pages/01.home/sagebrush.md /var/www/html/user/pages/01.home/sagebrush.md
COPY grav/config/system.yaml /var/www/html/user/config/system.yaml
COPY grav/config/site.yaml /var/www/html/user/config/site.yaml

# Drop the stock quark home page so '/' renders via the sagebrush template.
RUN rm -f /var/www/html/user/pages/01.home/default.md

# Copy the built static bundle into the theme's site/ dir. <base href> in the
# template points here: /user/themes/sagebrush/site/.
COPY --from=build /app/public/app.js              /var/www/html/user/themes/sagebrush/site/app.js
COPY --from=build /app/public/colors_and_type.css /var/www/html/user/themes/sagebrush/site/colors_and_type.css
COPY --from=build /app/public/site.css            /var/www/html/user/themes/sagebrush/site/site.css
COPY --from=build /app/public/assets              /var/www/html/user/themes/sagebrush/site/assets
COPY --from=build /app/public/fonts               /var/www/html/user/themes/sagebrush/site/fonts

# Clear caches + fix ownership for the apache user. The admin account is NOT
# created here — the entrypoint creates it at runtime from the injected
# password, so no credential is baked into the image.
RUN set -eux; \
    php bin/grav clearcache; \
    chown -R www-data:www-data /var/www/html

# Entrypoint creates the admin account on first boot (from $GRAV_ADMIN_PASSWORD)
# and fixes ownership of the PVC-mounted user/ dirs, then hands off to Apache.
COPY grav/docker-entrypoint.sh /usr/local/bin/sagebrush-entrypoint.sh
RUN chmod +x /usr/local/bin/sagebrush-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/usr/local/bin/sagebrush-entrypoint.sh"]
CMD ["apache2-foreground"]
