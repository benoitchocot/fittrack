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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: API requests
  if (url.pathname.startsWith('/api/')) {
    // Strategy 1a: Non-GET API requests (POST, PUT, DELETE, PATCH, etc.) - Network only
    if (request.method !== 'GET') {
      event.respondWith(fetch(request));
      return;
    }

    // Strategy 1b: API GET requests - Network first, then cache
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(error => {
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              throw error;
            });
        })
    );
  } 
  // Strategy 2: Non-API GET requests (static assets) - Cache first, then network
  else if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request)
            .then(response => {
              if (response && response.status === 200 && response.type === 'basic') {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(request, responseToCache));
              }
              return response;
            });
        })
    );
  } 
  // Strategy 3: Non-API, Non-GET requests
  else {
    event.respondWith(fetch(request));
  }
});
