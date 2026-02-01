const CACHE_NAME = 'al-quran-v2.1-offline';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-128.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

const EXTERNAL_HOSTS = [
  'api.alquran.cloud',
  'cdn.islamic.network',
  'api.aladhan.com',
  'cdn.tailwindcss.com',
  'esm.sh',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          fetch(url).then(res => {
            if (res.ok) cache.put(url, res);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First for logic files, Stale-While-Revalidate for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // For app logic files, always try network first to avoid caching bugs during development
  const isAppFile = url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts') || url.pathname.endsWith('index.tsx');

  if (isAppFile) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  const isExternalAllowed = EXTERNAL_HOSTS.some(host => url.host.includes(host));
  const isLocal = url.origin === self.location.origin;

  if (isExternalAllowed || isLocal) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});