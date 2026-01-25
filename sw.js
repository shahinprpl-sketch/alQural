
const CACHE_NAME = 'al-quran-v1.8-offline';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-128.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap'
];

const EXTERNAL_API_HOSTS = [
  'api.alquran.cloud',
  'cdn.islamic.network',
  'api.aladhan.com'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Precaching static shell');
      return cache.addAll(STATIC_ASSETS);
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

// Fetch Event - Stale While Revalidate
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache valid responses from known API hosts or local files
        const isApi = EXTERNAL_API_HOSTS.some(host => url.host === host);
        const isLocal = url.origin === self.location.origin;

        if (networkResponse && networkResponse.status === 200 && (isApi || isLocal)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to cache if network fails
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
