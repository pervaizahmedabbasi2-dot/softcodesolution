<<<<<<< HEAD
// SoftCode Enterprise Service Worker - Network First with Auto-Refresh
const CACHE_NAME = 'scs-multi-tenant-cloud-v4';

=======
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
<<<<<<< HEAD
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => caches.delete(cache))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker for camera video stream blobs, API calls, and WebSockets
  if (
    event.request.url.startsWith('blob:') ||
    url.pathname.startsWith('/api') ||
    event.request.url.startsWith('ws://') ||
    event.request.url.startsWith('wss://')
  ) {
    return;
  }

  // Network-first strategy: always fetch fresh from server, fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match('/index.html');
        });
      })
  );
=======
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching to avoid conflicts with development/HMR
  // This satisfies the PWA builder checks while keeping the development experience smooth.
  return;
>>>>>>> 9c235392d5f1bb1fddf7df4c8ac032dca552b27b
});
