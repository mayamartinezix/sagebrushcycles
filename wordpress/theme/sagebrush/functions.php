<?php
/**
 * Sagebrush Cycle theme — WordPress (cms/wordpress) variant.
 *
 * The site is a single React-rendered page. This theme does NOT use the normal
 * WordPress loop/widgets/wp_head: front-page.php and index.php both call
 * sagebrush_render_page(), which emits a self-contained HTML document that
 * loads the prebuilt React bundle (app.js, in this theme's site/ dir) and
 * injects window.SB_CONTENT — exactly the same contract as the Grav variant's
 * Twig template. The editable copy lives in the `sagebrush_content` option,
 * edited via the "Site Copy" admin page registered below. app.js is
 * content-free, so editing Site Copy re-renders the public page.
 */

if (!defined('ABSPATH')) { exit; }

const SAGEBRUSH_OPTION = 'sagebrush_content';

/**
 * Default site copy. Mirrors src/content.json from the static build, so the
 * page renders meaningfully before anyone touches the admin (and the Site Copy
 * form shows these as starting values). The saved option, once present, is a
 * complete structure and wins outright.
 */
function sagebrush_default_content() {
    return array(
        'business' => array(
            'name'         => 'Sagebrush Cycle',
            'tagline'      => 'BIKE RENTALS · WEISER TRAIL',
            'phoneDisplay' => '(208) 555-0148',
            'phoneHref'    => '+12085550148',
            'email'        => 'hello@sagebrushcycle.co',
        ),
        'hero' => array(
            'eyebrow'    => "WE'RE WHEELY GLAD YOU'RE HERE",
            'titleLine1' => 'Easygoing bike rentals,',
            'titleLine2' => 'right by the trail.',
            'lead'       => "Grab a comfy bike for a half day or a full day and roll straight out onto the Weiser Trail. Two wheels, zero worries — just tell us when you'd like to ride and we'll have one ready to roll.",
            'ctaPrimary' => 'Saddle up',
            'ctaPhone'   => 'Or give us a call',
            'badge'      => 'Hop on!',
        ),
        'rates' => array(
            'title' => "Rates that won't tire you out",
            'sub'   => "Helmet, lock, and a little trail map come with every bike — that's just how we roll.",
            'items' => array(
                array(
                    'icon'    => 'sun',
                    'name'    => 'Half day',
                    'price'   => '$24',
                    'unit'    => 'up to 4 hours',
                    'desc'    => 'Just right for an easy out-and-back along the river. No spokes about it.',
                    'popular' => false,
                ),
                array(
                    'icon'    => 'bike',
                    'name'    => 'Full day',
                    'price'   => '$38',
                    'unit'    => 'all day, your pace',
                    'desc'    => 'Ride the whole trail and stop wherever looks good. Go on, gear out.',
                    'popular' => true,
                ),
            ),
        ),
        'footer' => array(
            'findTitle' => 'Find us',
            'findBody'  => "Weiser Trailhead\nby the river bridge",
            'openTitle' => 'Open',
            'openBody'  => "Thu–Mon · 8am–6pm\nClosed Tue & Wed",
            'sayTitle'  => 'Say hi',
            'note'      => "Happy trails — we're wheely grateful you rolled by.",
        ),
    );
}

/**
 * The content to render: the saved option if present, else the defaults. Each
 * top-level section falls back independently so a partial/old option can never
 * blank out a whole section.
 */
function sagebrush_get_content() {
    $defaults = sagebrush_default_content();
    $saved    = get_option(SAGEBRUSH_OPTION);
    if (!is_array($saved)) {
        return $defaults;
    }
    $out = $defaults;
    foreach (array('business', 'hero', 'footer') as $section) {
        if (!empty($saved[$section]) && is_array($saved[$section])) {
            $out[$section] = array_merge($defaults[$section], $saved[$section]);
        }
    }
    if (!empty($saved['rates']) && is_array($saved['rates'])) {
        $out['rates']['title'] = isset($saved['rates']['title']) ? $saved['rates']['title'] : $defaults['rates']['title'];
        $out['rates']['sub']   = isset($saved['rates']['sub'])   ? $saved['rates']['sub']   : $defaults['rates']['sub'];
        if (isset($saved['rates']['items']) && is_array($saved['rates']['items'])) {
            $out['rates']['items'] = array_values($saved['rates']['items']);
        }
    }
    return $out;
}

/**
 * Emit the single-page document. Mirrors the Grav variant's Twig template:
 *  - <base href> is ROOT-RELATIVE to this theme's site/ dir (e.g.
 *    /wp-content/themes/sagebrush/site/). We deliberately avoid an absolute
 *    URL: behind APISIX/Caddy WordPress can mis-detect the internal gateway
 *    port, which would send asset requests to an unreachable port and render
 *    blank. A root-relative base resolves against the browser's real origin.
 *  - window.SB_CONTENT is injected from the Site Copy option; app.js reads it.
 */
function sagebrush_render_page() {
    $content = sagebrush_get_content();
    // Path-only base href: strip scheme+host so it works on any origin/port.
    $base = rtrim(wp_parse_url(get_template_directory_uri(), PHP_URL_PATH), '/') . '/site/';
    ?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sagebrush Cycle — Bike rentals on the Weiser Trail</title>
  <meta name="description" content="Easygoing half- and full-day bike rentals right by the Weiser Trail. Reserve online or give us a call.">
  <base href="<?php echo esc_attr($base); ?>">
  <link rel="icon" href="assets/emblem.svg" type="image/svg+xml">
  <link rel="stylesheet" href="colors_and_type.css">
  <link rel="stylesheet" href="site.css">
</head>
<body>
  <div id="root"></div>
  <script>window.SB_CONTENT = <?php echo wp_json_encode($content); ?>;</script>
  <script src="app.js"></script>
</body>
</html>
<?php
}

/* ────────────────────────── Theme setup ────────────────────────── */

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
});

/* ───────────────────── "Site Copy" admin page ───────────────────── */

add_action('admin_menu', function () {
    add_menu_page(
        'Site Copy',                 // page title
        'Site Copy',                 // menu label
        'edit_theme_options',        // capability
        'sagebrush-site-copy',       // slug
        'sagebrush_render_admin_page',
        'dashicons-edit',
        3
    );
});

/** Handle the Site Copy form submission (admin-post.php?action=sagebrush_save). */
add_action('admin_post_sagebrush_save', function () {
    if (!current_user_can('edit_theme_options')) {
        wp_die('Insufficient permissions.');
    }
    check_admin_referer('sagebrush_site_copy');

    $raw = isset($_POST['sb']) && is_array($_POST['sb']) ? wp_unslash($_POST['sb']) : array();
    $t  = static function ($v) { return sanitize_text_field((string) $v); };
    $ta = static function ($v) { return sanitize_textarea_field((string) $v); };

    $content = array(
        'business' => array(
            'name'         => $t($raw['business']['name'] ?? ''),
            'tagline'      => $t($raw['business']['tagline'] ?? ''),
            'phoneDisplay' => $t($raw['business']['phoneDisplay'] ?? ''),
            'phoneHref'    => $t($raw['business']['phoneHref'] ?? ''),
            'email'        => sanitize_email($raw['business']['email'] ?? ''),
        ),
        'hero' => array(
            'eyebrow'    => $t($raw['hero']['eyebrow'] ?? ''),
            'titleLine1' => $t($raw['hero']['titleLine1'] ?? ''),
            'titleLine2' => $t($raw['hero']['titleLine2'] ?? ''),
            'lead'       => $ta($raw['hero']['lead'] ?? ''),
            'ctaPrimary' => $t($raw['hero']['ctaPrimary'] ?? ''),
            'ctaPhone'   => $t($raw['hero']['ctaPhone'] ?? ''),
            'badge'      => $t($raw['hero']['badge'] ?? ''),
        ),
        'rates' => array(
            'title' => $t($raw['rates']['title'] ?? ''),
            'sub'   => $ta($raw['rates']['sub'] ?? ''),
            'items' => array(),
        ),
        'footer' => array(
            'findTitle' => $t($raw['footer']['findTitle'] ?? ''),
            'findBody'  => $ta($raw['footer']['findBody'] ?? ''),
            'openTitle' => $t($raw['footer']['openTitle'] ?? ''),
            'openBody'  => $ta($raw['footer']['openBody'] ?? ''),
            'sayTitle'  => $t($raw['footer']['sayTitle'] ?? ''),
            'note'      => $ta($raw['footer']['note'] ?? ''),
        ),
    );

    if (!empty($raw['rates']['items']) && is_array($raw['rates']['items'])) {
        foreach ($raw['rates']['items'] as $item) {
            if (!is_array($item)) { continue; }
            $name  = $t($item['name'] ?? '');
            $price = $t($item['price'] ?? '');
            // Skip fully-empty rows (e.g. a "remove" that left a blank).
            if ($name === '' && $price === '') { continue; }
            $icon = ($item['icon'] ?? 'sun') === 'bike' ? 'bike' : 'sun';
            $content['rates']['items'][] = array(
                'icon'    => $icon,
                'name'    => $name,
                'price'   => $price,
                'unit'    => $t($item['unit'] ?? ''),
                'desc'    => $ta($item['desc'] ?? ''),
                'popular' => !empty($item['popular']),
            );
        }
    }

    update_option(SAGEBRUSH_OPTION, $content);

    wp_safe_redirect(add_query_arg(
        array('page' => 'sagebrush-site-copy', 'updated' => '1'),
        admin_url('admin.php')
    ));
    exit;
});

/** Render the Site Copy admin form. */
function sagebrush_render_admin_page() {
    $c = sagebrush_get_content();

    $field = static function ($name, $label, $value, $hint = '') {
        printf(
            '<tr><th scope="row"><label for="%1$s">%2$s</label></th><td>'
            . '<input type="text" class="regular-text" id="%1$s" name="%1$s" value="%3$s">%4$s</td></tr>',
            esc_attr($name),
            esc_html($label),
            esc_attr($value),
            $hint ? '<p class="description">' . esc_html($hint) . '</p>' : ''
        );
    };
    $area = static function ($name, $label, $value, $hint = '') {
        printf(
            '<tr><th scope="row"><label for="%1$s">%2$s</label></th><td>'
            . '<textarea class="large-text" rows="3" id="%1$s" name="%1$s">%3$s</textarea>%4$s</td></tr>',
            esc_attr($name),
            esc_html($label),
            esc_textarea($value),
            $hint ? '<p class="description">' . esc_html($hint) . '</p>' : ''
        );
    };
    ?>
    <div class="wrap">
        <h1>Site Copy</h1>
        <p>Everything a visitor reads on the home page. Saving updates the live
           site immediately (it's served by the same React app as the other
           Sagebrush versions). The big photo is <code>assets/hero.jpg</code> in
           the theme — swap it in a rebuild, not here.</p>
        <?php if (!empty($_GET['updated'])) : ?>
            <div class="notice notice-success is-dismissible"><p>Saved.</p></div>
        <?php endif; ?>

        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="sagebrush_save">
            <?php wp_nonce_field('sagebrush_site_copy'); ?>

            <h2>Business details</h2>
            <table class="form-table" role="presentation"><tbody>
                <?php
                $field('sb[business][name]', 'Business name', $c['business']['name']);
                $field('sb[business][tagline]', 'Tagline', $c['business']['tagline']);
                $field('sb[business][phoneDisplay]', 'Phone (shown)', $c['business']['phoneDisplay'], 'How the number reads, e.g. (208) 555-0148');
                $field('sb[business][phoneHref]', 'Phone (dialled)', $c['business']['phoneHref'], 'Digits the call button dials, e.g. +12085550148');
                $field('sb[business][email]', 'Email', $c['business']['email']);
                ?>
            </tbody></table>

            <h2>Hero (the headline area)</h2>
            <table class="form-table" role="presentation"><tbody>
                <?php
                $field('sb[hero][eyebrow]', 'Eyebrow', $c['hero']['eyebrow'], 'Small line above the headline');
                $field('sb[hero][titleLine1]', 'Headline line 1', $c['hero']['titleLine1']);
                $field('sb[hero][titleLine2]', 'Headline line 2', $c['hero']['titleLine2']);
                $area('sb[hero][lead]', 'Intro paragraph', $c['hero']['lead']);
                $field('sb[hero][ctaPrimary]', 'Main button', $c['hero']['ctaPrimary']);
                $field('sb[hero][ctaPhone]', 'Call link text', $c['hero']['ctaPhone']);
                $field('sb[hero][badge]', 'Photo badge', $c['hero']['badge']);
                ?>
            </tbody></table>

            <h2>Rates</h2>
            <table class="form-table" role="presentation"><tbody>
                <?php
                $field('sb[rates][title]', 'Section title', $c['rates']['title']);
                $area('sb[rates][sub]', 'Section subtitle', $c['rates']['sub']);
                ?>
            </tbody></table>

            <h3>Rate cards</h3>
            <p class="description">Add, remove, or reorder the pricing cards. "Popular" gives a card the highlighted style.</p>
            <div id="sb-rates" data-next="<?php echo (int) count($c['rates']['items']); ?>">
                <?php foreach ($c['rates']['items'] as $i => $it) { sagebrush_render_rate_row($i, $it); } ?>
            </div>
            <p><button type="button" class="button" id="sb-add-rate">+ Add rate card</button></p>

            <?php submit_button('Save changes'); ?>

            <h2>Footer</h2>
            <table class="form-table" role="presentation"><tbody>
                <?php
                $field('sb[footer][findTitle]', 'Find-us heading', $c['footer']['findTitle']);
                $area('sb[footer][findBody]', 'Address', $c['footer']['findBody'], 'One line per row');
                $field('sb[footer][openTitle]', 'Hours heading', $c['footer']['openTitle']);
                $area('sb[footer][openBody]', 'Hours', $c['footer']['openBody'], 'One line per row');
                $field('sb[footer][sayTitle]', 'Contact heading', $c['footer']['sayTitle']);
                $area('sb[footer][note]', 'Closing note', $c['footer']['note']);
                ?>
            </tbody></table>

            <?php submit_button('Save changes'); ?>
        </form>
    </div>

    <template id="sb-rate-template"><?php sagebrush_render_rate_row('__I__', null); ?></template>
    <script>
    (function () {
        var wrap = document.getElementById('sb-rates');
        var tpl  = document.getElementById('sb-rate-template').innerHTML;
        document.getElementById('sb-add-rate').addEventListener('click', function () {
            var i = parseInt(wrap.dataset.next, 10) || 0;
            wrap.dataset.next = i + 1;
            var html = tpl.replace(/__I__/g, i);
            var div = document.createElement('div');
            div.innerHTML = html;
            wrap.appendChild(div.firstElementChild);
        });
        wrap.addEventListener('click', function (e) {
            if (e.target.classList.contains('sb-remove-rate')) {
                e.preventDefault();
                var card = e.target.closest('.sb-rate-card');
                if (card) { card.parentNode.removeChild(card); }
            }
        });
    })();
    </script>
    <style>
        .sb-rate-card{border:1px solid #c3c4c7;background:#fff;border-radius:6px;padding:8px 16px;margin:0 0 12px;max-width:50em}
        .sb-rate-card .form-table{margin-top:0}
    </style>
    <?php
}

/** One rate-card editor row. $index is an int or the JS template token __I__. */
function sagebrush_render_rate_row($index, $item) {
    $item = is_array($item) ? $item : array();
    $icon    = ($item['icon'] ?? 'sun') === 'bike' ? 'bike' : 'sun';
    $name    = $item['name'] ?? '';
    $price   = $item['price'] ?? '';
    $unit    = $item['unit'] ?? '';
    $desc    = $item['desc'] ?? '';
    $popular = !empty($item['popular']);
    $n = static function ($k) use ($index) { return sprintf('sb[rates][items][%s][%s]', $index, $k); };
    ?>
    <div class="sb-rate-card">
        <table class="form-table" role="presentation"><tbody>
            <tr><th scope="row">Icon</th><td>
                <select name="<?php echo esc_attr($n('icon')); ?>">
                    <option value="sun"<?php selected($icon, 'sun'); ?>>Sun (half day)</option>
                    <option value="bike"<?php selected($icon, 'bike'); ?>>Bike (full day)</option>
                </select>
            </td></tr>
            <tr><th scope="row">Name</th><td><input type="text" class="regular-text" name="<?php echo esc_attr($n('name')); ?>" value="<?php echo esc_attr($name); ?>"></td></tr>
            <tr><th scope="row">Price</th><td><input type="text" class="regular-text" name="<?php echo esc_attr($n('price')); ?>" value="<?php echo esc_attr($price); ?>"></td></tr>
            <tr><th scope="row">Unit</th><td><input type="text" class="regular-text" name="<?php echo esc_attr($n('unit')); ?>" value="<?php echo esc_attr($unit); ?>" placeholder="up to 4 hours"></td></tr>
            <tr><th scope="row">Description</th><td><textarea class="large-text" rows="2" name="<?php echo esc_attr($n('desc')); ?>"><?php echo esc_textarea($desc); ?></textarea></td></tr>
            <tr><th scope="row">Popular</th><td>
                <label><input type="checkbox" value="1" name="<?php echo esc_attr($n('popular')); ?>"<?php checked($popular); ?>> Highlight this card</label>
                &nbsp;&nbsp;<button type="button" class="button-link delete sb-remove-rate">Remove card</button>
            </td></tr>
        </tbody></table>
    </div>
    <?php
}
