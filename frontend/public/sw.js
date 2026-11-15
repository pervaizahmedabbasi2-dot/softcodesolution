// SoftCode Enterprise Service Worker - Network First with Offline Shell & Face AI Model Resilience
const CACHE_NAME = 'scs-multi-tenant-cloud-v9';
const FACE_MODEL_ASSETS = [
  '/',
  '/manifest.json',
  '/face-models/tiny_face_detector_model-weights_manifest.json',
  '/face-models/tiny_face_detector_model.bin',
  '/face-models/face_landmark_68_tiny_model-weights_manifest.json',
  '/face-models/face_landmark_68_tiny_model.bin',
  '/face-models/face_recognition_model-weights_manifest.json',
  '/face-models/face_recognition_model.bin'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FACE_MODEL_ASSETS).catch(() => {})).finally(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cache) => cache !== CACHE_NAME).map((cache) => caches.delete(cache))
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
          return caches.match('/index.html').then((idx) => idx || caches.match('/'));
        });
      })
  );
});
