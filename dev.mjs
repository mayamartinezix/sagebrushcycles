// Dev mode: build src/ → public/, serve it on http://localhost:8080, and rebuild
// + live-reload the browser whenever anything in src/ changes.
//
//   npm run dev
//
// Zero dependencies beyond esbuild (already used by build.mjs). The production
// build/deploy path is untouched — this only exists for local editing.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { build, SRC, OUT } from "./build.mjs";

const PORT = Number(process.env.PORT) || 8080;
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// Connected browsers waiting for the "reload now" server-sent event.
const clients = new Set();

function rebuild(reason) {
  try {
    build({ dev: true });
    console.log(`✓ rebuilt (${reason})`);
    for (const res of clients) res.write("data: reload\n\n");
  } catch (err) {
    // Keep the server (and last good page) alive on a build error — just log it.
    console.error(`✗ build failed (${reason}):\n${err.message}`);
  }
}

rebuild("startup");

// ── static file server + live-reload event stream ──
http
  .createServer((req, res) => {
    if (req.url === "/__livereload") {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      });
      res.write("\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    const rel = req.url === "/" ? "index.html" : decodeURIComponent(req.url.slice(1));
    const file = path.join(OUT, rel);
    fs.readFile(file, (err, data) => {
      if (err) {
        res.statusCode = 404;
        return res.end("404");
      }
      res.setHeader("content-type", MIME[path.extname(file)] || "application/octet-stream");
      res.setHeader("cache-control", "no-store"); // always serve the freshest build
      res.end(data);
    });
  })
  .listen(PORT, () => console.log(`dev server → http://localhost:${PORT}  (watching ${SRC}/)`));

// ── watch src/ and rebuild on change (debounced) ──
let timer = null;
fs.watch(SRC, { recursive: true }, (_event, filename) => {
  if (filename && /(^|[\\/])\./.test(filename)) return; // ignore dotfiles/swap files
  clearTimeout(timer);
  timer = setTimeout(() => rebuild(filename || "change"), 100);
});
