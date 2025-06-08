const CACHE_NAME = 'static-assets-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/thumbnail.png'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Attempting to install and cache static assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cache opened successfully:', CACHE_NAME);
        return cache.addAll(ASSETS_TO_CACHE)
          .then(() => {
            console.log('[Service Worker] All static assets added to cache:', ASSETS_TO_CACHE);
          })
          .catch(error => {
            console.error('[Service Worker] Failed to cache static assets during install:', error);
          });
      })
      .catch(error => {
        console.error('[Service Worker] Failed to open cache during install:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  // You might want to add logic here to clean up old caches if CACHE_NAME changes
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ensure new service worker takes control immediately
});

self.addEventListener('fetch', event => {
  console.log(`[Service Worker] Fetching resource: ${event.request.url}`);
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log(`[Service Worker] Found in cache: ${event.request.url}`);
          return cachedResponse;
        }
        console.log(`[Service Worker] Not found in cache, attempting network fetch for: ${event.request.url}`);
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              console.log(`[Service Worker] Network fetch for ${event.request.url} failed or returned invalid response:`, response);
              return response;
            }

            console.log(`[Service Worker] Network fetch successful for: ${event.request.url}`);
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log(`[Service Worker] Caching new resource: ${event.request.url}`);
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.error(`[Service Worker] Failed to cache new resource ${event.request.url}:`, error);
              });
            return response;
          }
        ).catch(error => {
          console.error(`[Service Worker] Network fetch failed for ${event.request.url}:`, error);
          // Optionally, you could return an offline fallback page here
          // For example: return caches.match('/offline.html');
          throw error;
        });
      })
  );
});
