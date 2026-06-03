# Versions of the Sagebrush Cycle website

There are **three live versions** of this website. They look identical to a
visitor — the difference is **how you edit them**. This page explains each one
and gives step-by-step, no-experience-needed instructions for making changes.

> Not sure which one is "yours"? If you want to edit the site by filling in
> **form fields in a web page**, use **Decap** or **Grav**. If you're happy
> editing the underlying files on GitHub, the **Original** is the simplest.

| Version | Address | How you edit it | Where edits are saved |
|---|---|---|---|
| **Original** | https://weeeeeiserbikes.staging.tripoli.systems | Edit the source files on GitHub | GitHub (the `main` branch) |
| **Decap CMS** | https://weeeeeiserbikes-decap.staging.tripoli.systems | A web editor at **/admin** (log in with GitHub) | GitHub (the `cms/decap` branch) |
| **Grav** | https://weeeeeiserbikes-grav.staging.tripoli.systems | Grav's admin at **/admin** (log in with a password) | The live site's own storage |

All three auto-publish: after you save, the live site updates on its own
(usually within a minute or two — Grav is near-instant). **A failed change never
breaks the live site** — visitors keep seeing the last good version.

There were originally going to be five versions; two were evaluated and dropped
— see [the end of this page](#evaluated-but-not-used).

---

## 1. Original — edit the files directly

- **Site:** https://weeeeeiserbikes.staging.tripoli.systems
- **Best for:** someone comfortable editing text files on GitHub. No login to a
  separate editor; you change the site's source pieces directly.

This is the plain version: the words and prices live **inside the website's
source files** (in the `src` folder). Full beginner instructions are in
[`README.md`](./README.md) — the short version:

1. Go to the repository on GitHub and open the **`src`** folder.
2. Click the file for what you want to change, then the **pencil ✏️** to edit:
   | To change… | Edit this file |
   |---|---|
   | Headline & welcome text | `src/Hero.jsx` |
   | Prices (Half day / Full day) | `src/Rates.jsx` |
   | Hours, address, email | `src/Footer.jsx` |
   | Business name / tagline | `src/Header.jsx` |
   | Phone number | `src/Header.jsx`, `src/Hero.jsx`, **and** `src/Footer.jsx` (all three) |
   | The big photo | replace `src/assets/hero.jpg` |
3. Change only the **words inside the quotes**; leave the quotes, brackets and
   punctuation alone.
4. Scroll down, keep **"Commit directly to the `main` branch"**, and click
   **Commit changes**.

The site rebuilds and goes live in ~1–2 minutes.

---

## 2. Decap CMS — a friendly web editor (saves to GitHub)

- **Site:** https://weeeeeiserbikes-decap.staging.tripoli.systems
- **Editor:** https://weeeeeiserbikes-decap.staging.tripoli.systems/admin
- **Best for:** non-technical editors who want labelled form fields, with every
  change still saved and versioned in GitHub.

Here all the editable text/prices live in **one file** (`src/content.json`), and
Decap gives you a form for it. To make a change:

1. Open **…/admin** in your browser.
2. Click **"Login with GitHub"** and authorize (you need GitHub access to the
   repository).
3. Click **"Website content"**. You'll see labelled fields — Business details,
   Hero (the headline area), **Rate cards** (add/remove/reorder the pricing
   cards), and Footer.
4. Edit the fields. To change the **photo**, use the image field (it uploads to
   the site's `assets` folder).
5. Click **Publish → Publish now** (top of the page).

That saves your change to the `cms/decap` branch on GitHub and the site updates
within a minute or two. Because everything is saved in GitHub, you have a full
history and can roll back any change.

*Prefer not to use the editor?* You can edit **`src/content.json`** directly on
GitHub (on the `cms/decap` branch) — same result.

---

## 3. Grav — a full CMS admin (saves to the live site)

- **Site:** https://weeeeeiserbikes-grav.staging.tripoli.systems
- **Admin:** https://weeeeeiserbikes-grav.staging.tripoli.systems/admin
- **Best for:** people who want a traditional "log in and edit" CMS dashboard.

To make a change:

1. Open **…/admin**.
2. Log in. **Username:** `admin`. **Password:** ask your setup helper — it's
   stored securely (technical note: `vault kv get -field=password kv/grav-admin`).
3. In the page list, open **Home**, then click the **"Site Copy"** tab.
4. Edit the labelled fields (business details, hero copy, the repeatable
   **Rate cards** list, footer) and click **Save**.

The change shows on the site within a few seconds.

> **Important difference from the other two:** Grav saves your edits to the
> **live site's own storage**, *not* to GitHub. That means Grav's content is
> independent — editing `src/content.json` in GitHub will **not** change the Grav
> site (that file is only used to set up a brand-new Grav instance). Always edit
> the Grav version through its **/admin**.

---

## After you make a change (any version)

1. On GitHub, a small **yellow dot 🟡** appears next to your change while the site
   rebuilds; it turns into a **green check ✓** when done (~1–2 minutes). A
   **red ✗** means the change had an error and **the live site was left
   untouched** (so visitors never see a broken page). *(Grav edits skip this —
   they apply almost immediately.)*
2. Open the site in a new tab. Still seeing the old version? Do a **hard
   refresh** to clear your browser's cache:
   - **Windows:** hold **Ctrl** and press **F5**
   - **Mac:** hold **⌘ Cmd + Shift** and press **R**

---

## Which should we keep?

For this site, the editing experience is best with **Decap** (free, fast,
edits saved/versioned in GitHub, nothing extra to run) or **Grav** (a richer
"log in and edit" dashboard, but heavier to run and its content lives outside
GitHub). The **Original** is the lightest of all if you're comfortable editing
files. Pick the one that matches how you'd like to work; the others can be
retired.

---

## Evaluated but not used

Two more CMSes were trialed and intentionally **not** adopted:

- **Sveltia CMS** — a modern, Decap-compatible editor. It worked, but it covers
  the same job as Decap, so it was dropped to avoid duplication.
- **WonderCMS** — a minimal single-file PHP CMS. It served the site and its admin
  logged in, but WonderCMS edits flat HTML pages and has no way to edit this
  site's *structured* content (the prices list, etc.), so it couldn't actually
  drive this site and was removed.

---

### For the technical maintainer

- Each version is a branch: `main` (Original), `cms/decap`, `cms/grav`. Pushing
  to a branch rebuilds its image and redeploys its subdomain via GitHub Actions
  → ghcr → Flux on the rumi cluster (see `CLAUDE.md` and, in the `rumi` repo,
  `docs/apps/weeeeeiserbikes.md`). Decap/Sveltia are git-overlay (nginx) builds;
  Grav is a PHP container with a persistent volume for its content + its admin
  password from Vault (`kv/grav-admin`). Decap's GitHub login uses an OAuth
  provider sidecar (`kv/decap-oauth`). The `cms/decap` and `cms/grav` branch
  `CMS-NOTES.md` files document each variant in depth.
