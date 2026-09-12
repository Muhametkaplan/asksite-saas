// PWA Service Worker for Aşk Dünyamız SaaS
const CACHE_NAME = 'ask-dunyasi-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Ignore chrome-extension and non-http(s) requests
  if (!event.request.url.startsWith('http')) return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        return caches.match('/');
      });
    })
  );
});

// --- Push Notification Handlers ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {
    title: 'Aşk Dünyamız ❤️',
    body: 'Sevgilinden yeni bir haber var!',
    icon: '/logo-icon.png',
    badge: '/favicon.ico',
    url: '/',
    tag: 'asksite-notification'
  };

  try {
    const data = event.data.json();
    payload = {
      ...payload,
      ...data,
      data: {
        url: data.url || (data.data && data.data.url) || '/'
      }
    };
  } catch (e) {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/logo-icon.png',
    badge: payload.badge || '/favicon.ico',
    vibrate: [200, 100, 200, 100, 200],
    data: payload.data || { url: payload.url || '/' },
    tag: payload.tag || 'asksite-notification',
    renotify: true,
    actions: [
      { action: 'open', title: 'Aç & Gör ✨' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with matching origin/url
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
