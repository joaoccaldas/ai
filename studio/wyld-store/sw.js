/* WYLD service worker (scope: the store + app). Network-first for our own
   small files so updates show immediately; cached copies are the offline
   fallback. Product images use a bounded cache-first store. Nothing else
   (other origins, large downloads, non-GET requests) is intercepted. */
const VERSION = 'wyld-v9';
const SHELL = `${VERSION}-shell`;
const IMAGES = `${VERSION}-images`;
const MAX_IMAGES = 120;

const SHELL_FILES = [
  './app/',
  './app/index.html',
  './app/app.css',
  './app/app.js',
  './app/manifest.webmanifest',
  './app/icons/icon-192.png',
  './app/icons/icon-512.png',
  './app/icons/apple-touch-icon.png',
  './app/icons/favicon-32.png',
  './data/catalog.js',
  './config/site.js',
  './src/core/format.js',
  './src/core/model.js',
  './src/core/storage.js',
  './src/core/runtime.js',
  './src/core/live.js',
  './fonts/fonts.css',
  './fonts/inknut-antiqua-400-latin.woff2',
  './fonts/instrument-sans-latin.woff2',
];
const SCOPE = new URL('./', self.location).href;
const IMAGE_HOSTS = new Set(['ridewyld.com', 'cdn.shopify.com']);
// Only small static files are cached; large downloads (APK, 3D models) always
// come straight from the network and never fill the cache.
const CACHEABLE = /\.(html|js|css|json|webmanifest|png|svg|woff2)$|\/$/;
const NEVER_CACHE = /\/downloads\/|\.(apk|glb|blend)$/;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !k.startsWith(`${VERSION}-`)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request, fallbackURL) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(request);
    const path = new URL(request.url).pathname;
    if (res.ok && CACHEABLE.test(path) && !NEVER_CACHE.test(path)) cache.put(request, res.clone());
    return res;
  } catch {
    return (await cache.match(request, { ignoreSearch: true }))
      || (fallbackURL && await cache.match(fallbackURL))
      || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGES);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === 'opaque')) { cache.put(request, res.clone()); trim(IMAGES, MAX_IMAGES); }
    return res;
  } catch {
    return new Response('', { status: 504 });
  }
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.href.startsWith(SCOPE)) {
    if (NEVER_CACHE.test(url.pathname)) return; // plain network, no cache
    const appPage = url.pathname.includes('/app/');
    event.respondWith(networkFirst(request, request.mode === 'navigate' ? (appPage ? './app/index.html' : './app/') : null));
    return;
  }
  if (IMAGE_HOSTS.has(url.hostname) && request.destination === 'image') {
    event.respondWith(cacheFirstImage(request));
  }
});
