# Hosting Warden on GitHub Pages (offline-capable)

This folder is a ready-to-deploy bundle: `index.html`, `sw.js` (service worker),
`manifest.json`, and `icon.svg`. Together they make Warden work like the
reading-app example you mentioned — visit once online, then it keeps working
offline, and quietly updates itself whenever you're back online.

## Setup (one time)

1. Create a GitHub repository (public or private — Pages works with both on
   paid plans; public repos get Pages free).
2. Upload all four files in this folder to the **root** of that repo (or to
   a `/docs` folder — either works, just match it in the next step).
3. In the repo: **Settings → Pages** → under "Build and deployment", set
   **Source** to "Deploy from a branch", pick your branch, and the folder
   you uploaded to (`/root` or `/docs`).
4. Wait a minute or two, then visit the URL GitHub gives you
   (`https://<your-username>.github.io/<repo-name>/`).

That's it — no build step, no dependencies.

## How the offline behavior works

- **First visit (online):** the page loads normally, and a service worker
  registers itself in the background and caches the app.
- **Later visits (offline):** the browser serves the cached copy instead of
  failing to load. The app opens and works exactly as it does online — your
  data was never in the cache to begin with (see below), so this only
  affects whether the *app itself* can open without a connection.
- **Later visits (online):** the app always fetches the latest version from
  GitHub first, and refreshes the cache with whatever it gets. If that
  version is newer than what's currently running, you'll see a small
  "A new version of Warden is ready — Reload" bar at the bottom of the
  screen. Nothing forces a reload on you.

## Your data is never touched by any of this

Your creatures, campaigns, characters, maps, and modifiers all live in the browser's
**IndexedDB**, which is completely separate storage from the **Cache
Storage** the service worker manages. Updating the app, clearing the
service worker's cache, or pushing a new version to GitHub can never
delete or roll back your saved data — only Warden's own "Clear All Data"
button in Settings does that, and it still asks you to confirm first.

## One thing worth knowing: this is a *different* copy of your data

Browser storage is scoped per website address (origin). If you've been
using the standalone `warden.html` file by opening it directly
(`file://...`), that data lives at the `file://` origin. Once you visit
this hosted version at `https://<you>.github.io/...`, you're at a
*different* origin — so it starts with an empty library, not a mirror of
your local file's data.

To bring your existing data over, either:
- **Export/Import:** in the old copy, go to Import/Export → Export All
  Data, then in the hosted copy, Import that backup file, or
- **GitHub Sync:** connect both copies to the same sync repository
  (Settings → GitHub Sync) and let them merge — this also keeps them in
  step automatically going forward.

## Updating the app later

If you (or I) hand you a newer version of these files, just upload them
over the old ones in the repo — GitHub Pages picks up the change, and the
network-first service worker strategy means visitors get it automatically
the next time they're online, with the "new version ready" prompt.

## Customizing the icon

`icon.svg` is a simple placeholder matching the in-app look. Any browser
that supports SVG manifest icons (most current ones) will use it as-is.
If you want a proper home-screen icon on older iOS Safari versions
specifically, swap in a PNG (e.g. `icon-192.png`) and update the `icons`
array in `manifest.json` and the `<link rel="apple-touch-icon">` tag in
`index.html` to point at it.
