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
import { fileURLToPath } from "node:url";

export const SRC = "src";
export const OUT = "public";
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

// The splitforms form key is baked into app.js at build time (it's public by
// design — it only identifies which form receives submissions). Set the
// SPLITFORMS_KEY env var to point a build at a different form — production,
// a per-developer test form, etc. Unset/empty falls back to the staging key.
const SPLITFORMS_KEY_DEFAULT = "45cc8be1f63e46f6a137f285544ad933";

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

// Build src/ → public/. Returns the list of files written. Pass {dev:true} to
// have index.html include the live-reload snippet the dev server listens for.
export function build({ dev = false } = {}) {
  // Fresh output dir.
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // ── app.js: vendor libs + transpiled components + the image-slot web component ──
  let js = "";
  for (const v of VENDORS) js += read(path.join(VENDOR, v)) + "\n";

  const define = {
    __SPLITFORMS_KEY__: JSON.stringify(process.env.SPLITFORMS_KEY || SPLITFORMS_KEY_DEFAULT),
  };
  for (const file of COMPONENTS) {
    const { code } = esbuild.transformSync(read(path.join(SRC, file)), {
      loader: "jsx",
      jsx: "transform",
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      minify: true,
      define,
    });
    js += code + "\n";
  }
  // image-slot.js is plain JS (a custom element); ship as-is.
  js += read(path.join(SRC, "image-slot.js")) + "\n";

  fs.writeFileSync(path.join(OUT, "app.js"), js);

  // ── static assets ──
  for (const css of STYLES) fs.copyFileSync(path.join(SRC, css), path.join(OUT, css));
  copyDir(path.join(SRC, "assets"), path.join(OUT, "assets"));
  copyDir(path.join(SRC, "fonts"), path.join(OUT, "fonts"));

  // ── index.html ──
  // In dev, append a tiny live-reload client; the dev server (dev.mjs) pushes a
  // server-sent event after each rebuild and the page reloads itself. The
  // production build never includes this.
  const liveReload = dev
    ? `  <script>new EventSource('/__livereload').onmessage=()=>location.reload();</script>\n`
    : "";
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
  <script src="app.js"></script>
${liveReload}</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, "index.html"), html);

  return fs.readdirSync(OUT);
}

// Run the build when invoked directly (`node build.mjs` / `npm run build`).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log("Built public/ →", build().join(", "));
}
