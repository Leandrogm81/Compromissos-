
const CACHE_NAME = 'agenda-pwa-cache-v1';
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
  const url = new URL(event.request.url);

  // Strategy 1: Cache-first for app shell assets.
  // These were pre-cached during the 'install' event.
  if (APP_SHELL_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request));
    return;
  }

  // Strategy 2: Stale-while-revalidate for navigation requests.
  // This serves the page from cache quickly and updates it in the background.
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
    return;
  }

  // For other requests (like CDN scripts, API calls), just go to the network.
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

  // This looks for an open window with the same URL and focuses it.
  // If no window is open, it opens a new one.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If a window is already open, focus it.
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
