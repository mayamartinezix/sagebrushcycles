# CMS-NOTES — `cms/grav` (Grav CMS)

This branch is the **Grav** variant: a full PHP flat-file CMS that serves the
SAME React front-end as the other variants, but injects the editable content
from a Grav page (editable in Grav's admin) instead of a static `content.json`.

Target URL: **https://weeeeeiserbikes-grav.staging.tripoli.systems/**
Editor: **…/admin**

## How it works (the injection contract)

Unlike Decap/Sveltia (git-based overlays on the static nginx site), Grav is a
**PHP application**. The image is a multi-stage build:

1. `node:22-alpine` runs the same `build.mjs` → the content-free React bundle
   (`app.js` + CSS + `assets/` + `fonts/`). We do **not** ship the generated
   `content.js`.
2. `php:8.3-apache` installs a pinned **Grav 1.7.52 + Admin** bundle, drops in a
   minimal custom `sagebrush` theme + a home page, and copies the built static
   files into `user/themes/sagebrush/site/`.

The theme template (`templates/sagebrush.html.twig`) emits the page shell with
`<base href=".../user/themes/sagebrush/site/">` (note the **required trailing
slash** — without it relative refs resolve one dir too high and nothing loads)
and injects `window.SB_CONTENT` from the page's `content:` frontmatter:

```twig
<script>window.SB_CONTENT = {{ page.header.content|json_encode|raw }};</script>
<script src="app.js"></script>
```

So editing the home page in Grav admin changes `window.SB_CONTENT` → the React
app re-renders with the new copy. The content shape mirrors `src/content.json`.

## Structured editing (blueprint)

`theme/sagebrush/blueprints/sagebrush.yaml` gives the admin **friendly form
fields** for the content (business details, hero copy, a repeatable list of rate
cards, footer) instead of raw YAML. Expert mode still shows the frontmatter
directly. This structured-field editing is Grav's main advantage over WonderCMS
for this site.

## Run locally

```
docker build -t sb-grav .
docker run --rm -p 8093:80 sb-grav
# site:  http://localhost:8093/         (renders hero + 2 rate cards from injected content)
# admin: http://localhost:8093/admin    (Grav login)
```
Default local admin: user `admin`, password from the `GRAV_ADMIN_PASSWORD`
build arg (see Dockerfile; a non-default staging value).

## How it deploys

Same image→ghcr→Flux-OCI-artifact→rumi path as the other variants, on push to
`cms/grav`: image `sagebrushcycles:grav-preview`, deploy bundle
`sagebrushcycles-deploy:grav-preview`. rumi side: `apps/weeeeeiserbikes-grav/`
(OCIRepository + Kustomization, + a Receiver for instant deploys). Resources are
sized for PHP (req 50m/128Mi, limit 500m/256Mi) vs the nginx variants.

## Required secrets / manual steps

- **Admin password.** Currently baked via the `GRAV_ADMIN_PASSWORD` build arg
  (strong, non-default; the image is private). For production, source it from a
  secret rather than baking — e.g. a Vault `kv/grav-admin` → ExternalSecret →
  env, with a startup entrypoint that (re)creates the account. Documented as a
  follow-up; baked is acceptable for staging.
- **Instant deploys** (optional): repo secrets `RUMI_FLUX_WEBHOOK_URL_GRAV` /
  `RUMI_FLUX_WEBHOOK_TOKEN_GRAV`; the OCIRepository poll is the fallback.

## ⚠️ Persistence caveat (important for a PHP CMS)

Grav stores content + accounts as **flat files inside the container**
(`user/pages`, `user/accounts`, …). With no volume, **admin edits do NOT survive
a pod restart** — the pod resets to the image's build-seeded content. For an
evaluation/demo that's fine (content is also editable via git → rebuild). For
real in-admin editing to persist, mount a **PVC** over the writable `user/`
subdirs, with an initContainer to seed it from the image on first boot. This is
the biggest operational difference vs the git-based overlays, which persist
edits as commits for free.

## Theme tradeoff

A minimal **custom** theme (just the one injection template + blueprint) was
written rather than adapting a stock Grav theme — the site is a single
React-rendered page, so a stock theme's layouts/partials would be dead weight.
The tradeoff: no Grav-native theming niceties, but a tiny, purpose-built theme
that's easy to reason about.

## Honest fit assessment

**Workable but heavy.** Grav genuinely handles this site's structured content
(blueprints → real forms, the best PHP-CMS editor UX of the two PHP options) and
could grow into a multi-page site. But it's the heaviest variant: a PHP runtime
(bigger image, more CPU/RAM than nginx), more security surface + update burden
(Grav core + Admin + plugins), and it needs a PVC to make admin edits persist —
re-introducing stateful storage that the git-based overlays avoid entirely. For
*this* small, mostly-static marketing site, Decap/Sveltia give the same editing
outcome with far less to run; Grav earns its weight only if you expect the site
to grow into something Grav's page model fits.
