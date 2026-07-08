# Sagebrush Cycle — your website

This is the home of your website. The live site customers see is:

### 👉 https://weeeeeiserbikes.staging.tripoli.systems

You change the website by editing the **pieces** it's made of (in the **`src`**
folder). When you save a change, the site rebuilds itself and goes live a minute
or two later. You don't need to install anything — you can do it all from this
page in your web browser.

---

## How your website is put together

Your website is **built** from a set of small source pieces — the headline, the
prices, the photo, the footer, and so on. A behind-the-scenes robot takes those
pieces and assembles the finished website automatically every time you make a
change.

> **The most important rule:** edit the pieces in the **`src`** folder.
> **Never** edit the **`public`** folder — that's the *finished, assembled*
> website the robot produces, and anything you change there gets wiped out and
> rebuilt on the next change. `src` = the ingredients (you edit these);
> `public` = the baked cake (don't touch).

You also never need to touch `deploy`, `build.mjs`, `Dockerfile`, or anything
starting with a dot. Leave them alone.

---

## What to edit for a common change

| You want to change… | Edit this piece |
|---|---|
| The big headline & welcome text | `src/Hero.jsx` |
| The prices (Half day / Full day) | `src/Rates.jsx` |
| Hours, address, email | `src/Footer.jsx` |
| The business name / "BIKE RENTALS · WEISER TRAIL" | `src/Header.jsx` |
| The phone number | it appears in **three** files — `src/Header.jsx`, `src/Hero.jsx`, and `src/Footer.jsx` (change it in all three) |
| The big trail photo | replace `src/assets/hero.jpg` (see "Swapping the photo" below) |
| The reservation form wording (fine print, confirmation message) | `src/RentalForm.jsx` |
| Where reservation requests are emailed | not a file — that's set in your [splitforms](https://splitforms.com) account (see "Good to know" below); ask your setup helper |

---

## How to make a text change (no software needed)

You'll do this on this repo's page in your browser
(github.com/licenseplated/sagebrushcycles).

1. Click into the **`src`** folder, then click the file you want from the table
   above (for example **`Rates.jsx`**).
2. Click the **pencil ✏️ icon** near the top right ("Edit this file").
3. Change only the **words inside the quotes**. For example, to change a price,
   find `price: '$24'` and change it to `price: '$28'`.
   - ⚠️ **Change the words, not the symbols around them.** Leave the quotes
     `'…'`, brackets, and punctuation exactly as they are. If you'd like, copy
     the original line into a note first so you can put it back.
4. Scroll down to the green **"Commit changes"** button. Type a short note about
   what you changed (e.g. *"Raise half-day price"*), keep **"Commit directly to
   the main branch"** selected, and click **Commit changes**.

That's it — the robot takes over from here. ✅

### Swapping the photo

1. Save your new photo as a **`.jpg`** (a wide, landscape photo looks best).
2. On GitHub, open the **`src/assets`** folder.
3. Click **Add file → Upload files**, drag your photo in, and **rename it to
   exactly `hero.jpg`** so it replaces the old one. (If it asks, commit the
   change.)

---

## Check that it worked

1. After you commit, a small **yellow dot 🟡** appears — the site is rebuilding.
   Wait a minute; it becomes a **green check ✓** when finished.
   - A **red ✗** means the rebuild failed and the live site was **left
     unchanged** (so visitors never see a broken page). See "If something goes
     wrong" below.
2. Open **https://weeeeeiserbikes.staging.tripoli.systems** in a new tab.
3. Still seeing the old version? Do a **hard refresh** to clear your browser's
   memory of the old page:
   - **Windows:** hold **Ctrl** and press **F5**
   - **Mac:** hold **⌘ Cmd + Shift** and press **R**

---

## If something goes wrong

**You can't break anything permanently — every version is saved.**

- A **red ✗** usually means a quote or bracket got changed by accident. The live
  site is safe; nothing went out.
- Click the **"History"** link (top of the file list) to see every past version.
  Open the last good one and put it back the same way you made the change — or
  send it to whoever set up your site and they'll undo it in seconds.

---

## Good to know

- **Changes take about 1–2 minutes** to go live after the green check ✓.
- **A failed build never reaches visitors** — the current site stays up until a
  good version is ready.
- **The address** (`weeeeeiserbikes.staging.tripoli.systems`) is a temporary
  staging address. When you're ready to use your real domain
  (like `sagebrushcycle.co`), ask your setup helper.
- **Reservation requests** from the "Reserve a bike" form arrive by email via
  [splitforms](https://splitforms.com) (free plan: 1,000 requests/month, with a
  dashboard showing every submission). Which splitforms form receives them is
  set by the `SPLITFORMS_KEY` setting described in the technical section — ask
  your setup helper if requests should go to a different email.

---

## For your web developer (the technical bits)

*Skip this unless you maintain the site.*

- **`src/` is the source of truth; `public/` is generated and git-ignored.**
  `npm run build` (`build.mjs`) transpiles the JSX to classic
  `React.createElement` with esbuild, prepends the vendored
  React/ReactDOM/lucide from `src/vendor/` (no CDN, no in-browser Babel),
  copies the CSS/fonts/SVGs/photo, and writes `public/index.html` + `app.js`.
- The site is the design-tool export kept in its on-globals/load-order form
  (`ui → Header → Hero → Rates → RentalForm → Footer → App`, then
  `image-slot.js`); the hero photo is wired via the `<image-slot src="…">`
  fallback so it's a plain swappable file.
- **Build/deploy:** a multi-stage `Dockerfile` (node build stage → nginx) runs
  the same `npm run build`. Pushes to `main` touching `src/**`, `build.mjs`,
  `package*.json`, `Dockerfile`, or the workflow trigger GitHub Actions, which
  builds the image (`ghcr.io/licenseplated/sagebrushcycles`), publishes a
  digest-pinned manifest bundle (`…/sagebrushcycles-deploy`) as a Flux OCI
  artifact, and pings the rumi Flux Receiver. Full runbook in the meta-repo at
  `rumi/docs/apps/weeeeeiserbikes.md`.
- **GitHub Pages copy:** `.github/workflows/pages.yml` also publishes the built
  site to `https://<owner>.github.io/sagebrushcycles/` on the same triggers.
  It's owner-agnostic (survives a repo transfer unchanged), auto-enables Pages
  on first run, and can be turned off by setting the repo Actions variable
  `PAGES_ENABLED=false`. A custom domain is just Settings → Pages + a DNS
  record — see the comments at the top of that workflow.
- **Form backend:** the rental form POSTs to splitforms
  (`https://splitforms.com/api/submit`). The access key is baked into `app.js`
  at build time via an esbuild define (`__SPLITFORMS_KEY__` in
  `RentalForm.jsx`): the `SPLITFORMS_KEY` env var overrides, unset falls back
  to the staging form's key in `build.mjs`. Per environment: the repo Actions
  variable `SPLITFORMS_KEY` feeds both workflows (Docker build-arg for the
  image, env for Pages); per developer, `SPLITFORMS_KEY=… npm run dev`. To
  point the Pages site at its own form, set `SPLITFORMS_KEY` as an
  environment variable on the `github-pages` environment (Settings →
  Environments) — it shadows the repo variable for the Pages job only (see
  the `pages.yml` header). The key is public by design (it only routes
  submissions), so it's a variable, not a secret.
- **Local preview:** `npm install && npm run preview` → http://localhost:8080
  (one-shot build, then serves it).
- **Dev mode (live reload):** `npm install && npm run dev` → http://localhost:8080.
  Watches `src/`, rebuilds on every save, and auto-refreshes the browser — leave
  it running while you edit. Set `PORT` to use another port
  (e.g. `PORT=3000 npm run dev`). The live-reload hook is dev-only; it never
  ships in the production build.
