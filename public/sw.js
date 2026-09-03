// Bumped 2026-09-03: the previous version may hold cached authenticated API
// responses (F14). Changing the version drops every old cache on activate.
const CACHE_VERSION = 'log-cache-v20260903';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/favicon-48x48.png',
  '/favicon.svg',
  '/logo-192.png',
  '/logo-512.png',
  '/robots.txt',
  '/sitemap.xml'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => !key.startsWith(CACHE_VERSION))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isAssetRequest(request) {
  const url = new URL(request.url);
  return request.method === 'GET' && (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/uploads/') ||
    /\.(?:js|css|ico|svg|png|jpe?g|webp|gif|woff2?)$/i.test(url.pathname)
  );
}

// F14: only public, non-personal endpoints may be cached.
//
// This used to cache every /api/ GET, including /api/orders and /api/analytics,
// which return order and revenue data for a logged-in admin. Those responses
// then sat in a shared cache and were served on later misses with no auth check.
const CACHEABLE_API_PATHS = [
  '/api/products',
  '/api/collections',
  '/api/stories',
  '/api/gallery',
  '/api/blogs',
  '/api/hero-config',
  '/api/new-in-config',
  '/api/content-blocks-config',
  '/api/coming-soon'
];

function isApiGet(request) {
  if (request.method !== 'GET') return false;
  // Never cache a request that carries credentials.
  if (request.headers.has('Authorization')) return false;
  const url = new URL(request.url);
  return CACHEABLE_API_PATHS.some(
    (path) => url.pathname === path || url.pathname.startsWith(`${path}/`)
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (isAssetRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (isApiGet(request)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
  }
});
