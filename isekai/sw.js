/* Isekai service worker: app-shell cache keyed by BUILD_ID.
 *
 * c0889fad.2 and /isekai/ are replaced by tools/build.mjs (BASE is '/' or '/isekai/'). A new build
 * means a new cache name; every other isekai-* cache is deleted on activate. Strategy:
 *   - install:   precache the shell (index, bundle, manifest, the OPFS worker; the files of WR62 best
 *                effort), then skipWaiting
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
const BUILD_ID = 'c0889fad.2';
const BASE = '/isekai/';
const CACHE_PREFIX = 'isekai-shell-';
const CACHE_NAME = CACHE_PREFIX + BUILD_ID;
const SHELL_INDEX = BASE + 'index.html';
/*
 * The precache list (WR62; PLAN 2.7): the app shell, the hub (a built-in Place inside the bundle),
 * and, once they exist, app/assets/library/icon/icons.json (M02) and app/assets/kits/core/ (M04);
 * nothing else under app/assets/ but Stage 1's app icons. tools/build.mjs writes the two arrays
 * between the markers from the build's output; nobody edits them by hand. Paths are relative to BASE.
 */
const PRECACHE_SHELL = /*precache-shell*/ ["opfs-worker.js","chunks/chunk-2EJ4OIV7.js","chunks/chunk-4ZGMG5FA.js","chunks/chunk-5Z2E77HA.js","chunks/chunk-5ZXQV45G.js","chunks/chunk-67UI2DKY.js","chunks/chunk-6GHMSENJ.js","chunks/chunk-6HDGFVLM.js","chunks/chunk-6KUPJNBI.js","chunks/chunk-6ZDDP2FS.js","chunks/chunk-BM2CXXXQ.js","chunks/chunk-BSSBL3R3.js","chunks/chunk-CD4NSQHH.js","chunks/chunk-CNBNU4XC.js","chunks/chunk-D2M7RLIY.js","chunks/chunk-D3D4GQN4.js","chunks/chunk-DXSZKB3J.js","chunks/chunk-EKM43EYW.js","chunks/chunk-ESNQV62N.js","chunks/chunk-GNL652YP.js","chunks/chunk-GYX6BMMI.js","chunks/chunk-JS4G6UW2.js","chunks/chunk-JTFQGKKI.js","chunks/chunk-JYBKNV3T.js","chunks/chunk-M427YPPT.js","chunks/chunk-MLGIXLV4.js","chunks/chunk-NWHDWKV2.js","chunks/chunk-OJ3G4LYC.js","chunks/chunk-OMOEI4IJ.js","chunks/chunk-OZW52OR6.js","chunks/chunk-QS6XRPQY.js","chunks/chunk-QY2VYYSF.js","chunks/chunk-RFQQ2Y3H.js","chunks/chunk-RNNXL4LS.js","chunks/chunk-RRJCXMOU.js","chunks/chunk-RZG3W526.js","chunks/chunk-S6RVKZ77.js","chunks/chunk-TGBCP6G7.js","chunks/chunk-VYESJRGO.js","chunks/chunk-WDQISWZZ.js","chunks/chunk-WJHVUYRH.js","chunks/chunk-WM3UKJJ7.js","chunks/chunk-XAWE4EAK.js","chunks/chunk-XWMAGABA.js","chunks/chunk-YI75O6NI.js"] /*end-precache-shell*/;
const PRECACHE_FILES = /*precache-files*/ ["assets/icons/icon-192.png","assets/icons/icon-512.png","assets/icons/icon-512-maskable.png","assets/library/icon/icons.json","assets/kits/core/catalog.json","assets/kits/core/graveyard_kit/SOURCE.json","assets/kits/core/graveyard_kit/fence.glb","assets/kits/core/graveyard_kit/gate.glb","assets/kits/core/graveyard_kit/lamp.glb","assets/kits/core/graveyard_kit/rock.glb","assets/kits/core/graveyard_kit/wall.glb","assets/kits/core/own/SOURCE.json","assets/kits/core/own/bell.glb","assets/kits/core/own/glow.glb","assets/kits/core/platformer_kit/SOURCE.json","assets/kits/core/platformer_kit/crate.glb","assets/kits/core/platformer_kit/ground_tile.glb","assets/kits/core/platformer_kit/tree.glb"] /*end-precache-files*/;
/** Must all be cached for the install to succeed. */
const PRECACHE_REQUIRED = [BASE, SHELL_INDEX, BASE + 'main.js?v=' + BUILD_ID, BASE + 'manifest.webmanifest', ...PRECACHE_SHELL.map((p) => BASE + p)];
/** Cached when available; a missing file must not block the install. */
const PRECACHE_OPTIONAL = PRECACHE_FILES.map((p) => BASE + p);

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
