
const CACHE_NAME = 'agenda-pwa-cache-v2';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/badge-72.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell and notification assets');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
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
    }).then(() => {
      // Tell the active service worker to take control of the page immediately.
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy 1: Cache-first for app shell assets.
  if (APP_SHELL_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request));
    return;
  }

  // Strategy 2: Stale-while-revalidate for navigation requests.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if(networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(err => {
            console.log('[SW] Fetch failed; returning cached response if available.', err);
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Strategy 3: Network first, then cache for other requests (like CDN scripts).
  // This provides offline functionality for external assets.
  event.respondWith(
    fetch(event.request).then(networkResponse => {
      if(networkResponse && networkResponse.status === 200) {
        if (url.hostname.includes('aistudiocdn.com')) {
          const cachePromise = caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          event.waitUntil(cachePromise);
        }
      }
      return networkResponse;
    }).catch(() => {
        // Network failed, try to get it from the cache.
        return caches.match(event.request);
    })
  );
});

// Listener for push notifications from a server.
self.addEventListener('push', event => {
  console.log('[SW] Push Received.');

  let data = {
    title: 'Agenda PWA',
    body: 'Você tem uma nova notificação.',
    url: '/'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.log('[SW] Push event data is not JSON, treating as text.');
      data.body = event.data.text();
    }
  }

  const title = data.title;
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: data.url }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener for when a user clicks on a notification.
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click Received.');

  const notificationData = event.notification.data || {};
  const urlToOpen = new URL(notificationData.url || '/', self.location.origin).href;
  
  event.notification.close(); // Close the notification

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
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
