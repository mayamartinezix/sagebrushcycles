#!/bin/sh
# Sagebrush Grav entrypoint.
#
# Durable deploy: a PVC backs user/{pages,accounts,config,data} so admin edits
# persist. The admin account is NOT baked into the image — it's created here on
# first boot from GRAV_ADMIN_PASSWORD (injected from Vault via the grav-admin
# Secret), so no credential lives in the image. On restarts the account already
# exists on the PVC, so this is a no-op. Rotating the password in Vault requires
# recreating the account (delete user/accounts/<user>.yaml + restart, or use the
# admin UI).
set -e
cd /var/www/html

ACC_USER="${GRAV_ADMIN_USER:-admin}"
if [ ! -f "user/accounts/${ACC_USER}.yaml" ]; then
  if [ -n "${GRAV_ADMIN_PASSWORD:-}" ]; then
    echo "[sagebrush] creating Grav admin account '${ACC_USER}'"
    php bin/plugin login new-user \
      --user="${ACC_USER}" \
      --email="${GRAV_ADMIN_EMAIL:-admin@sagebrushcycle.co}" \
      --password="${GRAV_ADMIN_PASSWORD}" \
      --permissions=b \
      --fullname="${GRAV_ADMIN_FULLNAME:-Sagebrush Admin}" \
      --state=enabled --no-interaction \
      || echo "[sagebrush] WARNING: admin account creation failed; /admin login unavailable"
  else
    echo "[sagebrush] GRAV_ADMIN_PASSWORD unset — skipping admin account creation (site still serves)"
  fi
fi

# Cache + ownership (PVC-mounted dirs come up owned by root).
php bin/grav clearcache >/dev/null 2>&1 || true
chown -R www-data:www-data user >/dev/null 2>&1 || true

exec "$@"
