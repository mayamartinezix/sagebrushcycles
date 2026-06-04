<?php
/**
 * Front page. The whole site is one React-rendered page; sagebrush_render_page()
 * (functions.php) emits the document and injects window.SB_CONTENT. We do NOT
 * run the loop or wp_head/wp_footer — the output is a clean, self-contained doc.
 */
if (!defined('ABSPATH')) { exit; }
sagebrush_render_page();
