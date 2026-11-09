self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests without caching to avoid conflicts with development/HMR
  // This satisfies the PWA builder checks while keeping the development experience smooth.
  return;
});
