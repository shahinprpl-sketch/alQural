
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
      console.log('Precaching static shell');
      // Using a wrapper to ensure failure of one asset doesn't break the whole install
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          fetch(url, { mode: 'no-cors' }).then(res => cache.put(url, res))
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

// Fetch Event - Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const isExternalAllowed = EXTERNAL_HOSTS.some(host => url.host.includes(host));
  const isLocal = url.origin === self.location.origin;

  if (isExternalAllowed || isLocal) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Cache status 200 (OK) and status 0 (Opaque/Cross-origin)
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch((err) => {
          if (cachedResponse) return cachedResponse;
          throw err;
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
