
const CACHE_NAME = 'agenda-pwa-cache-v1';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  // Note: In a real build, you'd add JS/CSS bundles here.
  // The CDN for Tailwind is fetched via network, but could be cached.
];

self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Use a stale-while-revalidate strategy for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
  }
  // For other requests, you can add more strategies (e.g., cache-first for assets)
});


self.addEventListener('push', event => {
  console.log('[SW] Push Received.');
  const data = event.data ? event.data.json() : { title: 'Lembrete', body: 'Você tem um novo lembrete.' };

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
