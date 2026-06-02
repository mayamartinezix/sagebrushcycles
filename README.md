# Sagebrush Cycle — your website

This is the home of your website. The live site that customers see is:

### 👉 https://weeeeeiserbikes.staging.tripoli.systems

When you change the file here, the live site updates by itself a minute or two
later. You don't need to install anything or call anyone to make a normal
update — you can do it from this web page in your browser.

---

## The one thing that IS your website

Inside the **`public`** folder there is a single file:

```
public/index.html
```

**That file *is* your website.** Whatever it contains is what visitors see.
To change the site, you replace that one file with a newer version, and the
live site catches up on its own.

Everything else in here is behind-the-scenes machinery. **You never need to
touch any other folder** (`deploy`, `src`, `.github`, or the files starting
with a dot). Leave them alone and everything keeps working.

---

## How to update the website (step by step)

You'll do this right here on the website's page in your browser
(github.com/licenseplated/sagebrushcycles). You do **not** need any special
software.

### Step 1 — Get the new version of your site

Open your site in the design tool you used to build it, make your changes
(new prices, new photos, new wording…), and **export / download it as a single
web page (an `.html` file)**. Save it somewhere easy to find, like your
Desktop. The exact button is usually called *Export*, *Download*, or
*Save as HTML*.

> 💡 You want the **standalone / single-file** version — one `.html` file that
> contains everything. If the tool gives you a folder of many files, look for
> the "standalone" or "single file" option.

### Step 2 — Put the new file in place

1. On this site's page, click into the **`public`** folder.
2. Click the file **`index.html`**.
3. Near the top right, click the **pencil ✏️ icon** ("Edit this file").
   - *(If editing is awkward because the file is large, use this instead:* go
     back to the `public` folder, click **Add file → Upload files**, drag your
     new file in, and **rename it to `index.html`** so it replaces the old one.)*
4. Replace the old contents with your new file's contents (or upload as above).

### Step 3 — Save it (this is called "Commit")

1. Scroll down to the **green "Commit changes" button**.
2. In the little message box, type what you changed, e.g.
   *"Updated summer rental prices"* — this is just a note for yourself.
3. Make sure **"Commit directly to the main branch"** is selected.
4. Click **Commit changes**.

That's it. You're done. ✅

### Step 4 — Check that it worked

1. After you commit, a small **yellow dot 🟡** appears near your change. That
   means the site is updating. Wait a minute — it turns into a
   **green check ✓** when it's finished. (A **red ✗** means something went
   wrong — see "If something looks wrong" below.)
2. Open **https://weeeeeiserbikes.staging.tripoli.systems** in a new tab.
3. If you still see the old version, do a **hard refresh** to clear your
   browser's memory of the old page:
   - **Windows:** hold **Ctrl** and press **F5**
   - **Mac:** hold **⌘ Cmd** and **Shift** and press **R**

Your update is now live for everyone.

---

## If something looks wrong

**Best safety net: every version is saved, and you can always go back.**

- If a change broke the site or looks wrong, click the **"History"** link
  (top of the file list) to see every past version. You can open an older,
  working version and put it back the same way you made the change.
- The site only changes when *you* commit, so it won't change on its own.
- If you're stuck, send this to whoever set up the site for you — they can
  undo any change in seconds.

---

## Good to know

- **Updates take about 1–2 minutes** after you commit. If it's been longer
  than ~5 minutes and the green check ✓ showed up, just hard-refresh
  (Step 4.3). If you see a red ✗ instead, the update didn't go out — go back
  to "History" and restore the last good version.
- **You can't break anything permanently.** Old versions are always saved.
- **The address** (`weeeeeiserbikes.staging.tripoli.systems`) is a temporary
  staging address. When you're ready to point your real domain name (like
  `sagebrushcycle.com`) at it, ask your setup helper.

---

## For your web designer / helper (the technical bits)

*Skip this section unless you maintain the site's plumbing.*

- `public/index.html` is the deployed artifact — a self-contained standalone
  export (React + fonts + assets all inlined; no CDN, no build step). nginx
  serves `public/` as-is.
- `src/` is the editable design source (JSX components, CSS, SVGs, fonts) the
  standalone file was exported from. It is **not** served or built by CI —
  it's an archive for regeneration. Re-export the standalone HTML and drop it
  in as `public/index.html`.
- A push to `main` touching `public/**`, `Dockerfile`, `.dockerignore`,
  `deploy/**`, or the workflow triggers GitHub Actions, which builds an
  `nginx:alpine` image (`ghcr.io/licenseplated/sagebrushcycles`), publishes a
  digest-pinned manifest bundle (`…/sagebrushcycles-deploy`) as a Flux OCI
  artifact, and pings the rumi Flux Receiver. README/docs-only commits are
  skipped. Full design + activation runbook is in the meta-repo at
  `rumi/docs/apps/weeeeeiserbikes.md`.
