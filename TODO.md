# TODO — four CMS variants of the Sagebrush Cycle site

> **STATUS (final outcome).** This was the original exploration plan; the work is
> done and decided. **Live now:** the Original (`main`), **Decap** (`cms/decap`),
> and **Grav** (`cms/grav`). **Evaluated and dropped:** **Sveltia** (covered by
> Decap) and **WonderCMS** (its flat-HTML model can't edit this site's structured
> content) — both have been removed (branches, deploys, and infra plumbing).
> See [`VERSIONS.md`](./VERSIONS.md) for the current, owner-facing guide to the
> live versions. The plan below is kept for historical context.

Plan for standing up **four independent CMS variants** of
`weeeeeiserbikes.staging.tripoli.systems`, each on its own branch and its own
staging subdomain, **without touching the existing site or its deploy path**.

| CMS         | Branch        | Subdomain                                                  | Shape                |
|-------------|---------------|------------------------------------------------------------|----------------------|
| Decap CMS   | `cms/decap`   | `weeeeeiserbikes-decap.staging.tripoli.systems`            | git-based overlay    |
| Sveltia CMS | `cms/sveltia` | `weeeeeiserbikes-sveltia.staging.tripoli.systems`          | git-based overlay    |
| Grav        | `cms/grav`    | `weeeeeiserbikes-grav.staging.tripoli.systems`             | PHP flat-file app    |
| WonderCMS   | `cms/wonder`  | `weeeeeiserbikes-wonder.staging.tripoli.systems`           | PHP flat-file app    |

> **Default git behaviour:** branch from `main`, push, open **draft** PRs, do
> **not** merge anything and do **not** merge branches into each other. The
> `main` branch and the live `weeeeeiserbikes.staging` deploy stay untouched.

---

## Phase 0 — Recon findings (the topology we must replicate)

Investigated `sagebrushcycles` + `rumi` + `odd`. Summary of how this site is
built, deployed, and networked, and what a *new* subdomain requires end to end.

### 1. Static-site stack
- **Build:** custom `build.mjs` (esbuild, the only dep). No SSG. Transpiles
  `src/*.jsx` → classic `React.createElement`, concatenates vendored
  React/ReactDOM/lucide + `image-slot.js` → `public/app.js`, copies CSS / `assets/`
  / `fonts/`, writes a generated `public/index.html`. `public/` is gitignored.
- **⚠️ There is NO content layer.** Editable copy is **hardcoded inside the JSX
  components**: phone in `Header.jsx` / `Hero.jsx` / `Footer.jsx`; the `RATES`
  array in `Rates.jsx`; hours / address / email in `Footer.jsx`; hero photo is
  `src/assets/hero.jpg`. There is **no markdown, frontmatter, JSON, or YAML
  content** for a CMS to read or round-trip. This is the central design problem
  for the two overlay variants (see Decap below).

### 2. IaC
- **k8s manifests + Flux (GitOps)**, split across two repos:
  - **`sagebrushcycles/deploy/`** — the app's own workload bundle
    (`namespace` / `deployment` / `service` / `httproute` + `kustomization.yaml`).
    Image is digest-pinned by CI (`__IMAGE__` placeholder). This bundle is **not**
    applied from git — CI publishes it as a Flux OCI artifact.
  - **`rumi/apps/weeeeeiserbikes/`** — the flux-system plumbing that consumes it:
    `OCIRepository` (tracks `sagebrushcycles-deploy:preview`), `Kustomization`,
    generic-hmac `Receiver`, `webhook-token` ExternalSecret, shared
    `flux-webhook` HTTPRoute, and an entry in `rumi/apps/kustomization.yaml`.

### 3. GitHub Actions (`.github/workflows/build-deploy.yml`)
On push to `main` touching `src/**` / `build.mjs` / `package*.json` / `Dockerfile`
/ `.dockerignore` / `deploy/**` / the workflow:
1. `docker build` (multi-stage: `node:22-alpine` builds → `nginx:alpine-slim`
   serves), push `ghcr.io/licenseplated/sagebrushcycles:preview` + `:<sha>`.
2. `sed` the digest into `deploy/deployment.yaml`, `flux push artifact deploy/` →
   `ghcr.io/licenseplated/sagebrushcycles-deploy:<sha>` + moving `:preview`.
3. POST HMAC-signed webhook → `flux-webhook.staging.tripoli.systems` for an
   instant reconcile (OCIRepository 30m poll is the fallback).

### 4. Hosting & networking (end-to-end path of a request)
```
client → odd haproxy (SNI literal match) → rumi host 10.8.0.205:443
       → Caddy (terminates TLS, edge *.staging.tripoli.systems wildcard cert)
       → in-cluster APISIX gateway VIP :80
       → HTTPRoute (Host match) → Service → Deployment (nginx / PHP pod)
```
- **DNS/TLS:** no per-host DNS or cert work — the `*.staging.tripoli.systems`
  wildcard already resolves and the edge wildcard cert at Caddy covers TLS. A new
  subdomain needs **two Ansible edits**, not a DNS record:
  - `odd/ansible/group_vars/all.yml` — a `haproxy` SNI literal route diverting the
    hostname to `rumi 10.8.0.205:443`.
  - `rumi/ansible/playbooks/caddy.yml` — a Caddy site block
    `upstream: "{{ caddy_ingress_vip }}:80"`.
  - **Apply order (matters): (1) odd SNI rule, (2) rumi Caddy block, (3)
    `systemctl reload caddy` on rumi.**

### 5. Secrets
- **Vault + External Secrets Operator** (`ClusterSecretStore` `vault`,
  `kv/...`). Webhook HMAC token lives at `kv/flux-webhook`. Image pull uses the
  cluster-wide `ghcr-pull` Secret fanned to every namespace from `kv/ghcr/pull`.
- **GitHub repo secrets:** `RUMI_FLUX_WEBHOOK_URL`, `RUMI_FLUX_WEBHOOK_TOKEN`
  (both optional — poll is the fallback).
- **Reuse this mechanism. Never commit plaintext.** Any OAuth client secret /
  admin password goes in Vault → ExternalSecret, or a GH Actions secret.

### 6. Git host
- **GitHub** (`licenseplated/sagebrushcycles`). ⇒ Decap uses the `github`
  backend + a GitHub OAuth app (needs an OAuth proxy unless we use a token flow);
  Sveltia uses the `github` backend + the `sveltia-cms-auth` Cloudflare Worker or
  a GitHub App. **rumi itself runs Forgejo**, but this repo is on GitHub — target
  GitHub backends.

---

## The "new-subdomain template" (replicated, parameterized, 4×)

Let `V` ∈ {`decap`, `sveltia`, `grav`, `wonder`} and
`HOST = weeeeeiserbikes-$V.staging.tripoli.systems`.

**A. In `sagebrushcycles` (on branch `cms/$V`) — fully automatable by us:**
1. CMS implementation (varies by variant — see below).
2. `deploy/` bundle parameterized to the variant:
   - `namespace`, Deployment/Service/HTTPRoute `name` → `weeeeeiserbikes-$V`.
   - HTTPRoute `hostnames: [$HOST]`.
   - container/port per variant (nginx :80 for overlays; PHP-FPM+nginx or
     `php:apache` for Grav/Wonder).
3. CI workflow parameterized so variants never collide on ghcr tags:
   - image → `ghcr.io/licenseplated/sagebrushcycles:$V-preview` + `:$V-<sha>`
     (PHP variants may warrant their own repo, e.g. `…/sagebrushcycles-grav`).
   - deploy artifact → `…/sagebrushcycles-deploy:$V-preview` + `:$V-<sha>`.
   - trigger on `push: branches: [cms/$V]` (not `main`).
   - webhook secrets → `RUMI_FLUX_WEBHOOK_URL_$V` / `_TOKEN_$V` (or reuse the
     shared URL with a per-variant token — see step C).

**B. In `rumi` (`apps/weeeeeiserbikes-$V/`) — we author, user reviews/merges:**
4. `oci-repository.yaml` tracking `sagebrushcycles-deploy:$V-preview`,
   `flux-kustomization.yaml`, `receiver.yaml` (targets the new OCIRepository),
   `webhook-token.yaml` (ExternalSecret from `kv/flux-webhook-$V`),
   `kustomization.yaml`. Reuse the shared `flux-webhook` HTTPRoute — each
   Receiver gets its own `/hook/<hash>` path, so **no new webhook hostname**.
5. Add `- weeeeeiserbikes-$V` to `rumi/apps/kustomization.yaml` **only after**
   the first `:$V-preview` deploy artifact exists in ghcr (else the apps
   Kustomization `wait` stalls).

**C. Networking + secrets — manual, user-run (cannot be done by us):**
6. `odd/ansible/group_vars/all.yml`: SNI literal route for `$HOST` → `rumi
   10.8.0.205:443` (copy the `weeeeeiserbikes` block, rename acl/backend).
7. `rumi/ansible/playbooks/caddy.yml`: site block for `$HOST` →
   `{{ caddy_ingress_vip }}:80`. **Apply order: odd → caddy block → reload.**
8. Vault: `vault kv put kv/flux-webhook-$V token=$(openssl rand -hex 32)`.
9. GH repo secrets: `RUMI_FLUX_WEBHOOK_URL_$V` (shared host +
   `kubectl -n flux-system get receiver weeeeeiserbikes-$V -o
   jsonpath='{.status.webhookPath}'`) and `RUMI_FLUX_WEBHOOK_TOKEN_$V`.
10. **OAuth (Decap/Sveltia only):** register a GitHub OAuth app / GitHub App;
    store client id/secret per step 8/9 mechanism. We leave a marked placeholder.

> **Rollback for any variant:** re-comment its line in `rumi/apps/kustomization.yaml`
> (Flux prunes the namespace + workload); delete the odd SNI entry to re-assert
> the trixi default. Caddy block + webhook plumbing are harmless if left.

---

## Per-variant work

### `cms/decap` — Decap CMS  *(do this one first)*
The overlay is trivial; **the content layer is the real work**, and it is shared
with Sveltia. Decision to confirm with the owner:
- **Introduce a content data layer** so there is something to round-trip. Extract
  the hardcoded copy into git-committed data files the build reads — proposal:
  `src/content/site.json` (phone, email, hours, address) + `src/content/rates.json`
  (the `RATES` array) + keep `hero.jpg` as a media file. Teach `build.mjs` to read
  them and the components to consume them. **Without this, a CMS has nothing
  meaningful to edit** and the variant is a hollow demo.
- [ ] Add the content layer + refactor `build.mjs`/components; `npm run build`
      must render identically to today (byte-diff the screenshot).
- [ ] `public/admin/index.html` (loads `decap-cms` from the pinned vendored
      script — **no CDN**, matching repo convention; verify current release) +
      `public/admin/config.yml` with `backend: { name: github, repo:
      licenseplated/sagebrushcycles, branch: cms/decap }` and collections mapped
      to `src/content/*.json` (a "files" collection of singletons + a "rates" list).
- [ ] OAuth: GitHub OAuth app + an OAuth proxy (Decap needs one for `github`).
      **Placeholder + documented manual step** — owner must register the app.
- [ ] `deploy/` + CI + rumi plumbing per template (nginx static, :80).
- [ ] `CMS-NOTES.md`.

### `cms/sveltia` — Sveltia CMS  *(near drop-in after Decap)*
- [ ] Start from the Decap `config.yml`; swap `/admin/index.html` to the Sveltia
      module script. Reuse the same `src/content/*` collections.
- [ ] Backend `github`; prefer the `sveltia-cms-auth` Worker or a GitHub App for
      OAuth. **Verify current release** (Sveltia is pre-1.0 / beta) and confirm no
      needed widget hits a known gap. Document any divergence from the Decap config.
- [ ] `deploy/` + CI + rumi plumbing per template (nginx static, :80).
- [ ] `CMS-NOTES.md`.

### `cms/grav` — Grav  *(PHP app — different image entirely)*
- [ ] Stand up Grav (verify current release + install docs). Migrate the copy
      into Grav pages (Markdown + frontmatter), preserving the single-page route.
- [ ] **Theme:** port the existing markup/CSS into a minimal custom Grav theme
      (pragmatic — the site is one page; document the tradeoff vs. adapting a
      stock theme).
- [ ] **Deploy = PHP container** (option (a) — infra is container/k3s, so this is
      preferred over Grav's static export). Multi-stage `Dockerfile`: composer/Grav
      install → `php:8.x-apache` (or php-fpm + nginx). HTTPRoute → container port.
      Adjust readiness/liveness probes (not just `/`). Resource limits ↑ vs nginx.
- [ ] CI + rumi plumbing per template (own image tag/repo).
- [ ] `CMS-NOTES.md` incl. the static-vs-container reasoning.

### `cms/wonder` — WonderCMS  *(PHP app — minimal)*
- [ ] Stand up WonderCMS (verify current release; it's a single flat JSON DB +
      WYSIWYG). Migrate content into its model; approximate the design via a theme.
- [ ] **Deploy = PHP container** (mandatory — WonderCMS has **no clean static
      export**, so option (a) is forced). Same container shape as Grav.
- [ ] **Security:** single admin password + secret login URL. On public staging,
      ensure the admin surface isn't trivially exposed — set a strong password
      (via Vault/ExternalSecret, not committed), consider gating `/admin`-style
      paths. Document the security model honestly.
- [ ] CI + rumi plumbing per template.
- [ ] `CMS-NOTES.md`.

---

## Execution order
1. **Confirm with owner** before mutating anything (esp. the content-layer
   refactor, which is a real change to how the site is built — though only on the
   variant branches, never `main`).
2. `cms/decap` end to end (incl. content layer) → verify URL serves the migrated
   site **and** `/admin` loads.
3. `cms/sveltia` (reuse Decap content + config).
4. `cms/grav` (PHP container path — establishes the PHP image pattern).
5. `cms/wonder` (reuse the Grav PHP container pattern).
6. For each: build cleanly, deploy to its subdomain with valid TLS, screenshot-verify.
7. Open **draft PRs** (no merges). Write each branch's `CMS-NOTES.md`.
8. Finish with a **cross-variant comparison** (implementation effort, hosting/
   runtime model, editor UX, maintenance burden, security surface) to inform the
   final choice.

## Guardrails
- `main` and the live `weeeeeiserbikes.staging` deploy are **untouched**. Never
  edit/commit `public/` or `node_modules/`. No CDN — vendor + pin per repo convention.
- Never commit secrets — Vault/ExternalSecret or GH Actions secrets only.
- Don't merge branches into one another; don't auto-apply rumi/odd Ansible.
- **Stop and hand back a precise ordered list** for anything we can't do: GitHub
  OAuth app registration, Vault writes, `odd`/`rumi` Ansible applies + caddy reload,
  GH repo-secret creation, and uncommenting the rumi `apps/kustomization.yaml` lines.

## Open questions for the owner
- [ ] OK to introduce the `src/content/*` data layer on the overlay branches?
      (Required for Decap/Sveltia to be meaningful.)
- [ ] One shared `ghcr.io/licenseplated/sagebrushcycles` image repo with per-variant
      tags, or separate repos for the PHP variants? (Affects `ghcr-pull` scope — none,
      it's cluster-wide — and package hygiene only.)
- [ ] Per-variant Vault webhook tokens (`kv/flux-webhook-$V`) vs. reusing one token?
- [ ] For Grav/Wonder admin on public staging: acceptable to expose `/admin`
      behind a strong password, or should we IP-gate / basic-auth it at Caddy?
