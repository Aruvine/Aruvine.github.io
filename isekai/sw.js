/* Isekai service worker: app-shell cache keyed by BUILD_ID.
 *
 * 2f283219.1 and /isekai/ are replaced by tools/build.mjs (BASE is '/' or '/isekai/'). A new build
 * means a new cache name; every other isekai-* cache is deleted on activate. Strategy:
 *   - install:   precache the shell (index, bundle, manifest; icons best effort), then skipWaiting
 *   - activate:  drop old caches, clients.claim, and post { type: 'isekai:sw', event: 'activated',
 *                build } to every window so the page can offer "new version available: reload"
 *                (app/src/ui/perf/pwa.ts listens; it ignores the message for its own build)
 *   - index.html / navigations: network-first, cached copy when offline
 *   - everything else same-origin under BASE: cache-first, filled on first use
 *   - the bundle is requested as main.js?v=<BUILD_ID> (index.html), so the first load after a
 *     deploy - new index from the network, old worker still in control - asks for a URL the old
 *     cache does not have and gets the new bundle: never a new index with an old bundle
 * Cross-origin requests are never touched here (world/model downloads get their own cache in net/).
 * index.html registers this worker only on real hosts (never localhost), with scope BASE.
 */
const BUILD_ID = '2f283219.1';
const BASE = '/isekai/';
const CACHE_PREFIX = 'isekai-shell-';
const CACHE_NAME = CACHE_PREFIX + BUILD_ID;
const SHELL_INDEX = BASE + 'index.html';
/** Must all be cached for the install to succeed. */
const PRECACHE_REQUIRED = [BASE, SHELL_INDEX, BASE + 'main.js?v=' + BUILD_ID, BASE + 'manifest.webmanifest'];
/** Cached when available; a missing icon must not block the install. */
const PRECACHE_OPTIONAL = [BASE + 'assets/icons/icon-192.png', BASE + 'assets/icons/icon-512.png', BASE + 'assets/icons/icon-512-maskable.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_REQUIRED.map((url) => new Request(url, { cache: 'reload' })));
      await Promise.all(
        PRECACHE_OPTIONAL.map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch (err) {
            console.warn('[sw] optional precache failed', url, err);
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('isekai-') && k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'isekai:sw', event: 'activated', build: BUILD_ID });
      }
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE)) return;

  const isShellDoc = req.mode === 'navigate' || url.pathname === BASE || url.pathname === SHELL_INDEX;
  event.respondWith(isShellDoc ? networkFirstShell(req) : cacheFirst(req));
});

async function networkFirstShell(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok) await cache.put(SHELL_INDEX, res.clone());
    return res;
  } catch (err) {
    const cached = (await cache.match(SHELL_INDEX)) || (await cache.match(BASE));
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok && res.type === 'basic') await cache.put(req, res.clone());
  return res;
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data === 'SKIP_WAITING' || (data && data.type === 'isekai:skip-waiting')) {
    self.skipWaiting();
  } else if (data && data.type === 'isekai:get-build' && event.source) {
    event.source.postMessage({ type: 'isekai:sw', event: 'build', build: BUILD_ID });
  }
});
