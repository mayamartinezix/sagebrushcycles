<?php
/**
 * Sagebrush Cycle — WordPress config for the SQLite, behind-a-proxy deploy.
 *
 * This replaces the official image's MySQL-oriented generated config. There is
 * NO database server: the SQLite Database Integration drop-in (wp-content/db.php,
 * installed in the Dockerfile) stores everything in wp-content/database/.ht.sqlite
 * on the PVC. The DB_* constants below are required by WordPress core but unused
 * by SQLite — leave them as harmless placeholders.
 */

// ── Public URL ──────────────────────────────────────────────────────────────
// Set WORDPRESS_SITE_URL to the externally-visible https URL (the Deployment
// injects it). Defaults to localhost for a bare `docker run`. Getting this right
// keeps wp-admin from redirect-looping behind Caddy/APISIX. Note: the PUBLIC
// page doesn't depend on it — the theme uses a root-relative <base href>.
$sb_site_url = getenv('WORDPRESS_SITE_URL') ?: 'http://localhost:8094';
define('WP_HOME', $sb_site_url);
define('WP_SITEURL', $sb_site_url);

// Trust the upstream TLS terminator (Caddy) so WP treats the request as https
// and builds https admin URLs / avoids mixed content.
if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
    $_SERVER['HTTPS'] = 'on';
} elseif (strpos($sb_site_url, 'https://') === 0) {
    $_SERVER['HTTPS'] = 'on';
}
if (!empty($_SERVER['HTTP_X_FORWARDED_HOST'])) {
    $_SERVER['HTTP_HOST'] = explode(',', $_SERVER['HTTP_X_FORWARDED_HOST'])[0];
}

// ── Database (placeholders — SQLite drop-in ignores these) ───────────────────
define('DB_NAME', 'wordpress');
define('DB_USER', 'wordpress');
define('DB_PASSWORD', 'unused-sqlite');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');

$table_prefix = 'wp_';

// ── Auth salts ───────────────────────────────────────────────────────────────
// Generated once on first boot by the entrypoint into a PVC-persisted file, so
// sessions survive pod restarts. Fallback constants keep a fresh container
// bootable before the file exists.
$sb_salts = __DIR__ . '/wp-content/database/salts.php';
if (is_readable($sb_salts)) {
    require $sb_salts;
}
foreach (array(
    'AUTH_KEY', 'SECURE_AUTH_KEY', 'LOGGED_IN_KEY', 'NONCE_KEY',
    'AUTH_SALT', 'SECURE_AUTH_SALT', 'LOGGED_IN_SALT', 'NONCE_SALT',
) as $sb_k) {
    if (!defined($sb_k)) {
        define($sb_k, 'sagebrush-staging-fallback-' . $sb_k);
    }
}

// ── Hardening / behaviour ────────────────────────────────────────────────────
define('DISALLOW_FILE_EDIT', true);   // no theme/plugin editor in admin
define('AUTOMATIC_UPDATER_DISABLED', true); // image is the source of truth
define('WP_AUTO_UPDATE_CORE', false);
if (!defined('WP_DEBUG')) { define('WP_DEBUG', false); }

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}
require_once ABSPATH . 'wp-settings.php';
