# sagebrushcycles

Placeholder static site for **Sagebrush Cycles**, served at
**weeeeeiserbikes.staging.tripoli.systems** on the rumi cluster.

## Layout

- `public/` — the static site (`index.html`, `site.css`, `site.js`, `media/`).
- `Dockerfile` — `nginx:alpine` with `public/` copied to the web root.
- `deploy/` — Kubernetes manifest bundle (Namespace / Deployment / Service /
  HTTPRoute). **Not applied from git** — CI digest-pins the image into
  `deploy/deployment.yaml` and `flux push artifact`s the bundle to
  `ghcr.io/licenseplated/sagebrushcycles-deploy`.
- `.github/workflows/build-deploy.yml` — build → push image → push deploy
  artifact → ping the rumi Flux Receiver.

## Deploy pipeline

```
push to main
  └─ build nginx image            → ghcr.io/licenseplated/sagebrushcycles:preview + :<sha>
  └─ render deploy/ (pin digest)
  └─ flux push artifact           → ghcr.io/licenseplated/sagebrushcycles-deploy:preview + :<sha>
  └─ POST flux-webhook (HMAC)     → rumi notification-controller
                                     └─ reconcile OCIRepository weeeeeiserbikes
                                        └─ Kustomization applies → Deployment rolls
```

rumi side lives in the **rumi** repo at `apps/weeeeeiserbikes/` (OCIRepository +
Kustomization + Receiver + flux-webhook HTTPRoute + Vault-sourced HMAC token).

## One-time activation

1. **ghcr packages** — first workflow run creates both `sagebrushcycles` and
   `sagebrushcycles-deploy` packages (private). Make sure the Vault
   `kv/ghcr/pull` token can read them (same token already used for other
   `ghcr.io/licenseplated/*` images), or set the packages' visibility/access.
2. **Vault** — seed the webhook HMAC token:
   `vault kv put kv/flux-webhook token=<random-hex>`
3. **rumi** — merge `apps/weeeeeiserbikes/` (registered in `apps/kustomization.yaml`)
   **after** the first deploy artifact exists (so the OCIRepository resolves and
   the parent `apps` Kustomization's `wait` doesn't stall). Apply the odd SNI
   routes and the rumi Caddy site blocks (see the runbook in the meta-repo).
4. **GitHub repo secrets** (optional, for instant deploys):
   - `RUMI_FLUX_WEBHOOK_URL` — `https://flux-webhook.staging.tripoli.systems` +
     the Receiver's `.status.webhookPath`.
   - `RUMI_FLUX_WEBHOOK_TOKEN` — the same token seeded in Vault.
   Without them, rumi still converges on the OCIRepository poll interval.
