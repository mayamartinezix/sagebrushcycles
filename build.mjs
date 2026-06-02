// Build the deployable site from src/ into public/.
//
// The site is small React-on-globals (each component attaches to window and the
// pieces load in order; App.jsx mounts). This script transpiles the JSX to plain
// browser JS (classic React.createElement — no in-browser Babel), concatenates it
// after the vendored React/ReactDOM/lucide (no CDN), and copies the CSS, fonts,
// SVGs and photo across. The result is public/index.html + app.js + assets.
//
// public/ is generated — never edit it by hand. Edit the pieces in src/ and run
// `npm run build`. See README.md.

import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const SRC = "src";
const OUT = "public";
const VENDOR = path.join(SRC, "vendor");

// Order matters: ui.jsx defines shared bits + ASSETS, the section components
// attach to window, App.jsx mounts last.
const COMPONENTS = [
  "ui.jsx",
  "Header.jsx",
  "Hero.jsx",
  "Rates.jsx",
  "RentalForm.jsx",
  "Footer.jsx",
  "App.jsx",
];
const VENDORS = [
  "react.production.min.js",
  "react-dom.production.min.js",
  "lucide.min.js",
];
const STYLES = ["colors_and_type.css", "site.css"];

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Fresh output dir.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ── app.js: vendor libs + transpiled components + the image-slot web component ──
let js = "";
for (const v of VENDORS) js += read(path.join(VENDOR, v)) + "\n";

for (const file of COMPONENTS) {
  const { code } = esbuild.transformSync(read(path.join(SRC, file)), {
    loader: "jsx",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    minify: true,
  });
  js += code + "\n";
}
// image-slot.js is plain JS (a custom element); ship as-is.
js += read(path.join(SRC, "image-slot.js")) + "\n";

fs.writeFileSync(path.join(OUT, "app.js"), js);

// ── content.js: editable site copy as a window global ──
// The site's words/prices/hours live in src/content.json (the one file a CMS
// edits). We emit them as `window.SB_CONTENT` in a SEPARATE script loaded
// BEFORE app.js, so app.js stays content-free and identical everywhere. The
// PHP CMS variants (Grav/WonderCMS) don't ship this file — their page template
// injects the same `window.SB_CONTENT` global from the CMS store instead, and
// the very same app.js renders it. Components fall back to baked-in defaults if
// the global is ever missing, so the site never renders blank.
const content = JSON.parse(read(path.join(SRC, "content.json")));
fs.writeFileSync(
  path.join(OUT, "content.js"),
  "window.SB_CONTENT = " + JSON.stringify(content) + ";\n"
);

// ── static assets ──
for (const css of STYLES) fs.copyFileSync(path.join(SRC, css), path.join(OUT, css));
copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));
copyDir(path.join(SRC, "fonts"), path.join(OUT, "fonts"));

// ── /admin: the Decap CMS editor (index.html + config.yml + vendored bundle) ──
// Present only on the cms/decap branch. Copied verbatim; it's a self-contained
// editor page that talks to GitHub, independent of the React site bundle.
if (fs.existsSync(path.join(SRC, "admin"))) {
  copyDir(path.join(SRC, "admin"), path.join(OUT, "admin"));
}

// ── index.html ──
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sagebrush Cycle — Bike rentals on the Weiser Trail</title>
  <meta name="description" content="Easygoing half- and full-day bike rentals right by the Weiser Trail. Reserve online or give us a call.">
  <link rel="icon" href="assets/emblem.svg" type="image/svg+xml">
  <link rel="stylesheet" href="colors_and_type.css">
  <link rel="stylesheet" href="site.css">
</head>
<body>
  <div id="root"></div>
  <!-- Generated bundle — do not edit. Built from src/ by build.mjs. -->
  <!-- content.js sets window.SB_CONTENT (from src/content.json); app.js reads it. -->
  <script src="content.js"></script>
  <script src="app.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, "index.html"), html);

console.log("Built public/ →", fs.readdirSync(OUT).join(", "));
