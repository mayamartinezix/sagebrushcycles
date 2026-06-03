# CMS-NOTES — `cms/decap` (Decap CMS)

This branch adds a **Decap CMS** editor at `/admin` on top of the existing
static site. The site build and hosting model are unchanged (nginx serving
static files); Decap is a git-based **overlay** that edits the site's content
files directly in this GitHub repo.

Target URL: **https://weeeeeiserbikes-decap.staging.tripoli.systems/**
Editor: **…/admin/**

## What was done

1. **Content layer** (shared with all variants): editable copy was extracted
   from the JSX into `src/content.json`. `build.mjs` emits `public/content.js`
   (`window.SB_CONTENT = …`) loaded before `app.js`; the React components read
   it with baked-in fallbacks. This gives Decap a real file to round-trip.
2. **Editor**: `src/admin/index.html` + `src/admin/config.yml` +
   `src/admin/vendor/decap-cms-3.13.0.js` (vendored, **no CDN**, matching the
   repo policy). `build.mjs` copies `src/admin/` → `public/admin/`.
3. **Collections**: a single "Website content" file collection maps every field
   of `src/content.json` to a friendly form (business details, hero, rate cards,
   footer). Photos upload to `src/assets` (`media_folder`), matching the
   `<image-slot src="assets/hero.jpg">` convention.
4. **Deploy/CI**: `deploy/` renamed to the `weeeeeiserbikes-decap` namespace +
   `weeeeeiserbikes-decap.staging.tripoli.systems` HTTPRoute; the workflow
   triggers on `cms/decap`, tags images/artifacts `decap-preview` / `decap-<sha>`,
   and pings `RUMI_FLUX_WEBHOOK_*_DECAP`.

## How to run locally

```
npm install && npm run build
npm run preview              # → http://localhost:8080  (site at /, editor at /admin/)
```
Or the production image:
```
docker build -t sb-decap . && docker run --rm -p 8091:80 sb-decap
# http://localhost:8091/  and  http://localhost:8091/admin/
```
The editor page loads and shows "Login with GitHub" — login itself needs the
OAuth handler below.

## How it deploys

Identical pipeline to the original (see `CLAUDE.md`): push to `cms/decap` →
GitHub Actions builds the nginx image → pushes `sagebrushcycles:decap-preview`
→ renders + `flux push artifact`s the digest-pinned `deploy/` bundle as
`sagebrushcycles-deploy:decap-preview` → pings the rumi Flux Receiver. rumi's
`apps/weeeeeiserbikes-decap/` (see `deploy-rumi/` and the repo-root
`INFRA-RUNBOOK.md`) applies it behind the `-decap` subdomain.

## OAuth login — sidecar in the same pod

Decap's GitHub backend can't complete login from the browser alone (GitHub
OAuth Apps don't support browser-only PKCE), so the handshake is done by a tiny
**OAuth provider sidecar** that runs **in the same pod** as the site:

- **Image:** `oauth/Dockerfile` builds `vencax/netlify-cms-github-oauth-provider`
  (pinned commit) → `ghcr.io/licenseplated/sagebrushcycles-decap-oauth` (CI).
- **Pod:** a second container (`oauth`, :3000) in `deploy/deployment.yaml`.
- **Routing:** the HTTPRoute sends `/auth`, `/callback`, `/success` to the
  sidecar; everything else to nginx. So the proxy lives on the **same hostname**
  as the site — `config.yml` `base_url` is just the site origin, no extra
  subdomain / SNI / Caddy block.
- **Secrets:** `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` come from Vault
  (`kv/decap-oauth`) via the `decap-oauth` ExternalSecret (`optional: true`, so
  the site still serves before the secret is seeded). `ORIGINS` and
  `REDIRECT_URL` are set as plain env in the Deployment.

### Manual steps to enable login

1. **Register a GitHub OAuth App** (Settings → Developer settings → OAuth Apps):
   - Homepage URL: `https://weeeeeiserbikes-decap.staging.tripoli.systems`
   - **Authorization callback URL:**
     `https://weeeeeiserbikes-decap.staging.tripoli.systems/callback`
2. **Put the credentials in Vault** (never commit them):
   ```
   vault kv put kv/decap-oauth client_id=<Client ID> client_secret=<Client Secret>
   ```
   The ExternalSecret syncs them into the pod within its refresh interval (or
   restart the deployment to pick them up immediately).
3. (Optional, instant deploys) repo secrets `RUMI_FLUX_WEBHOOK_URL_DECAP` /
   `RUMI_FLUX_WEBHOOK_TOKEN_DECAP`; Vault `kv/flux-webhook-decap`.

## Content-migration caveats

- The rental form's hardcoded price hints (`$24 · up to 4 hrs`) and phone
  placeholder in `src/RentalForm.jsx` are **not** wired to `content.json` (they're
  illustrative form UI, not site copy). Editing rates in the CMS updates the
  Rates section but not those form hints.
- Editing commits to `cms/decap` and rebuilds that branch's site only.

## Fit assessment

**Very good fit.** Decap is a thin, free, self-hosted overlay that leaves the
fast static-nginx hosting untouched and round-trips to a clean JSON file. The
one real cost is standing up + maintaining the OAuth proxy. Editor UX is solid
for structured content; non-technical editors get labelled form fields rather
than raw JSON.
