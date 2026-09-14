/*
  Warden service worker.

  Strategy: "network-first, falling back to cache" for every same-origin
  GET request (the app is a single HTML file plus a couple of tiny assets,
  so there's no meaningful split between "app shell" and "data" here).

  - Online:  always fetch fresh from the network, then quietly update the
             cache with what came back. You always get the latest version
             you (or I) publish to this repo, with zero extra taps.
  - Offline: serve whatever was last cached, so the app still opens.

  This file never touches IndexedDB or any app data — that lives entirely
  in the browser's IndexedDB storage for this origin, which the browser
  keeps completely separate from the Cache Storage this worker manages.
  Updating or clearing this cache can never delete your creatures,
  campaigns, or characters.
*/

const CACHE_NAME = 'warden-cache-v1';
const PRECACHE_URLS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never intercept third-party requests

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        // Navigations (loading the page itself) fall back to the cached shell
        // even if the exact URL wasn't cached (e.g. a deep link).
        if (req.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        throw new Error('Offline and nothing cached for this request.');
      })
  );
});
