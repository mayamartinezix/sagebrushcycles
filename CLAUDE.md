# CLAUDE.md

Guidance for Claude Code (and developers) working in this repo.

## What this is

The **Sagebrush Cycle** marketing site — a single-page bike-rental site served
at **`weeeeeiserbikes.staging.tripoli.systems`** on the rumi cluster. It is the
first image-based app on rumi whose source + CI live in this external GitHub repo
(`licenseplated/sagebrushcycles`) rather than being vendored into rumi.

`README.md` is the **website owner's** guide (non-technical: how to edit the site
via the GitHub web UI). This file is the technical/architecture layer — keep the
two in sync when the build or deploy shape changes.

## Architecture: source → build → image → deploy

```
src/  ──(npm run build / build.mjs)──>  public/  ──(Dockerfile)──>  nginx image  ──>  ghcr ──> rumi
(edit this)        generated, gitignored        multi-stage          ghcr.io/licenseplated/sagebrushcycles
```

- **`src/` is the source of truth.** `public/` is **generated and git-ignored** —
  never edit or commit it. Anyone hand-editing `public/` will have it wiped on the
  next build; that mistake is exactly what this build setup exists to prevent.
- The site is a design-tool export kept in its original **React-on-globals,
  load-order** form (not ES modules): each component is a `function X(){…};
  window.X = X`. Load order matters: `ui → Header → Hero → Rates → RentalForm →
  Footer → App`, then `image-slot.js`; `App.jsx` mounts via
  `ReactDOM.createRoot`. `ASSETS = 'assets'` (defined in `ui.jsx`).

## Build (`build.mjs`)

`npm run build` runs `build.mjs` (esbuild as the only dep):

1. Transpiles each `src/*.jsx` to **classic `React.createElement`** (esbuild
   `loader:'jsx'`, `jsxFactory:'React.createElement'`, `jsxFragment:'React.Fragment'`)
   — **no in-browser Babel**.
2. Concatenates **vendored** `src/vendor/{react,react-dom}.production.min.js` +
   `lucide.min.js` (pinned, **no CDN**) before the transpiled components +
   `image-slot.js` → `public/app.js`.
3. Copies `colors_and_type.css`, `site.css`, `assets/`, `fonts/`, and writes a
   generated `public/index.html` (links the CSS + `app.js`, `#root` div).

Local preview: `npm install && npm run preview` → http://localhost:8080 (one-shot
build + serve).

Dev mode: `npm run dev` (`dev.mjs`) builds + serves `public/` and watches `src/`,
rebuilding and live-reloading the browser on every save. It calls the same
exported `build({dev:true})` from `build.mjs` — the only difference is a tiny
`EventSource('/__livereload')` snippet appended to `index.html`, which the dev
server pings (server-sent event) after each rebuild. That hook is **dev-only**;
`npm run build` / the Dockerfile never include it. Port via `PORT` env
(default 8080). Zero new deps — `dev.mjs` is plain Node + esbuild.

### Notable details

- **The hero photo** is `src/assets/hero.jpg`, wired via the `<image-slot
  src="assets/hero.jpg">` fallback attribute (see `src/Hero.jsx`). `image-slot.js`
  is the design tool's user-fillable image web component; outside its "omelette"
  runtime it's read-only and just shows `src`. Swapping the photo = replacing that
  one file. (Its `.image-slots.state.json` sidecar mechanism is unused here.)
- **The phone number** appears in three components: `Header.jsx`, `Hero.jsx`,
  `Footer.jsx`. Prices live in the `RATES` array in `Rates.jsx`; hours/address/
  email in `Footer.jsx`.
- **The rental form** submits to **splitforms** (form-to-email,
  `https://splitforms.com/api/submit`). The access key is injected at build
  time: `RentalForm.jsx` references the bare identifier `__SPLITFORMS_KEY__`,
  which `build.mjs` substitutes via esbuild `define` — `SPLITFORMS_KEY` env var
  overrides, unset/empty falls back to the staging key
  (`SPLITFORMS_KEY_DEFAULT` in `build.mjs`). Per-environment wiring: repo
  Actions variable `SPLITFORMS_KEY` → Docker `--build-arg` in
  `build-deploy.yml` / build-step `env` in `pages.yml`; per-developer:
  `SPLITFORMS_KEY=… npm run dev`. To give the **Pages site its own form**,
  set `SPLITFORMS_KEY` as an environment variable on the `github-pages`
  environment (Settings → Environments) — the `pages.yml` job runs in that
  environment, so the env-scoped value shadows the repo variable there
  (invisible in the workflow file; documented in its header), while
  `build-deploy.yml` keeps the repo-level one. The key is **public by design** (ships in
  `app.js`; it only routes submissions to a form), hence an Actions variable
  rather than a secret. Don't edit the key in `RentalForm.jsx` — change the
  env var / Actions variable, or the default in `build.mjs`.
- **Fonts** (`src/fonts/`) are **WOFF2**, ~944 KB total (down from ~3.8 MB of
  TTF): the 5 static Baloo 2 weights + 2 Nunito Sans variable fonts, full (not
  subset — so the rental-form inputs keep every glyph). The unreferenced
  `Baloo2-VariableFont_wght.ttf` was dropped. If you add a weight, convert it the
  same way (`fontTools.ttLib.TTFont(...).flavor='woff2'`) and keep the CSS
  `format('woff2')`.

## Image & deploy

- **`Dockerfile` is multi-stage**: a `node:22-alpine` stage runs `npm ci && npm
  run build`; the final **`nginx:alpine-slim`** stage copies only `/app/public`.
  The build tooling never ships — the image is nginx + the static files. CI does
  not need Node; everything happens inside `docker build`.
- **`.github/workflows/build-deploy.yml`** (GitHub Actions, this is the only repo
  that runs GH Actions — rumi uses Forgejo). On push to `main` touching `src/**`,
  `build.mjs`, `package*.json`, `Dockerfile`, `.dockerignore`, `deploy/**`, or the
  workflow itself (README/docs-only commits are skipped; `workflow_dispatch` for a
  manual run), it:
  1. builds + pushes the image to `ghcr.io/licenseplated/sagebrushcycles` (`:preview` + `:<sha>`),
  2. renders the digest-pinned manifest bundle in `deploy/` (`__IMAGE__` → the
     image digest) and `flux push artifact`s it to
     `ghcr.io/licenseplated/sagebrushcycles-deploy`,
  3. POSTs the HMAC-signed Flux webhook (`RUMI_FLUX_WEBHOOK_URL/_TOKEN` repo
     secrets) for an instant rumi reconcile (the OCIRepository poll is the
     fallback).
- **`deploy/`** is the Kubernetes manifest bundle (Namespace/Deployment/Service/
  HTTPRoute). It is **not** applied from this repo — CI digest-pins and publishes
  it as a Flux OCI artifact. Image pull uses rumi's cluster-wide `ghcr-pull`
  secret.
- **`.github/workflows/pages.yml`** additionally publishes the same `npm run
  build` output to **GitHub Pages** (`https://<owner>.github.io/<repo>/`) on the
  same source-path triggers — the two deploys coexist. It is deliberately
  **owner-agnostic for repo transfer**: nothing in it names the owner, the first
  run auto-enables Pages (`configure-pages` with `enablement: true`), and it can
  be switched off without edits via the repo Actions variable
  `PAGES_ENABLED=false`. The generated site uses only relative asset paths, so it
  works at the Pages subpath and at a custom-domain root alike. Custom domains
  are configured in Settings → Pages (not a `CNAME` file — that's ignored for
  Actions-sourced deploys); the DNS `CNAME` target is `<owner>.github.io`, so a
  repo transfer also means a DNS update.

### rumi side (in the `rumi` repo)

`apps/weeeeeiserbikes/` holds the flux-system plumbing that consumes the above: an
`OCIRepository` tracking `sagebrushcycles-deploy:preview`, a `Kustomization`, a
generic-hmac `Receiver`, the `flux-webhook.staging.tripoli.systems` HTTPRoute, and
a Vault-sourced (`kv/flux-webhook`) HMAC token. Caddy site blocks + odd haproxy
SNI routes front both hostnames. Full runbook: `rumi/docs/apps/weeeeeiserbikes.md`.

> Why an OCIRepository manifest bundle (not an image-tag poller): rumi's
> notification-controller `Receiver` can't target a flux-operator
> `ResourceSetInputProvider`, and there's no image-automation-controller — so the
> webhook-triggerable path is an `OCIRepository` of CI-rendered manifests.

## Conventions

- **Never commit `public/` or `node_modules/`** (both git-ignored). Edit `src/`,
  run `npm run build` to verify locally.
- Keep `README.md` (owner-facing) and this file (technical) in sync with the build
  on any change to the build/deploy shape.
- Vendored libs in `src/vendor/` are pinned (React 18.3.1, lucide 0.460.0) — no
  CDN at build or runtime. Bump deliberately.
- Verify a build renders before pushing: `npm run build` then screenshot
  `public/index.html` (headless Chrome works: `google-chrome --headless=new
  --screenshot=... file://…/public/index.html`).
