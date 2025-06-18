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
  const { request } = event;
  const url = new URL(request.url);

  // Log the request method and URL for debugging
  console.log(`[Service Worker] Fetch event for: ${request.method} ${request.url}`);

  // Strategy 1: API requests
  if (url.pathname.startsWith('/api/')) {
    console.log(`[Service Worker] Request is an API call: ${request.method} ${request.url}`);
    // Strategy 1a: Non-GET API requests (POST, PUT, DELETE, PATCH, etc.) - Network only
    if (request.method !== 'GET') {
      console.log(`[Service Worker] API call is non-GET (${request.method}), fetching from network only.`);
      event.respondWith(fetch(request));
      return; // Important to return here to not proceed to other strategies
    }

    // Strategy 1b: API GET requests - Network first, then cache
    console.log(`[Service Worker] API GET request, attempting network first: ${request.url}`);
    event.respondWith(
      fetch(request)
        .then(response => {
          console.log(`[Service Worker] Network fetch for API GET ${request.url} successful.`);
          // Check if the response is valid (e.g., status 200)
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log(`[Service Worker] Caching API GET response for: ${request.url}`);
                cache.put(request, responseToCache);
              })
              .catch(err => {
                console.error(`[Service Worker] Failed to cache API GET response for ${request.url}:`, err);
              });
          } else {
            console.log(`[Service Worker] Network response for API GET ${request.url} was not ok:`, response);
          }
          return response; // Return the original network response
        })
        .catch(error => {
          console.warn(`[Service Worker] Network fetch for API GET ${request.url} failed: ${error}. Trying cache...`);
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log(`[Service Worker] Found API GET response in cache for: ${request.url}`);
                return cachedResponse;
              }
              console.error(`[Service Worker] No cache match for API GET ${request.url} after network failure. Re-throwing error.`);
              throw error; // Re-throw the network error if no cache match
            });
        })
    );
  } 
  // Strategy 2: Non-API GET requests (static assets) - Cache first, then network
  else if (request.method === 'GET') {
    console.log(`[Service Worker] Request is a non-API GET, attempting cache first: ${request.url}`);
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log(`[Service Worker] Found static asset in cache: ${request.url}`);
            return cachedResponse;
          }
          console.log(`[Service Worker] Static asset not in cache, fetching from network: ${request.url}`);
          return fetch(request)
            .then(response => {
              // Check if we received a valid response (status 200, type 'basic' for same-origin assets)
              if (response && response.status === 200 && response.type === 'basic') {
                console.log(`[Service Worker] Network fetch for static asset ${request.url} successful.`);
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    console.log(`[Service Worker] Caching new static asset: ${request.url}`);
                    cache.put(request, responseToCache);
                  })
                  .catch(err => {
                    console.error(`[Service Worker] Failed to cache static asset ${request.url}:`, err);
                  });
              } else if (response) {
                console.log(`[Service Worker] Network response for static asset ${request.url} was not cacheable (status: ${response.status}, type: ${response.type}).`);
              } else {
                console.log(`[Service Worker] Network fetch for static asset ${request.url} returned no response object.`);
              }
              return response; // Return the original network response (or error)
            })
            .catch(error => {
              console.error(`[Service Worker] Network fetch for static asset ${request.url} failed:`, error);
              // Optionally, return an offline fallback page here for static assets
              // e.g., return caches.match('/offline.html');
              throw error;
            });
        })
    );
  } 
  // Strategy 3: Non-API, Non-GET requests (should be rare for typical web browsing of assets)
  else {
    console.log(`[Service Worker] Request is non-API and non-GET (${request.method}), fetching from network only: ${request.url}`);
    event.respondWith(fetch(request));
  }
});
