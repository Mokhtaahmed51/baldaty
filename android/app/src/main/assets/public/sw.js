// Baldaty PWA Service Worker
const CACHE_NAME = 'baldaty-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/public/manifest.json',
  '/public/baldaty_logo.png',
  '/public/pwa-192x192.png',
  '/public/pwa-512x512.png',
  '/public/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('PWA Precache partial fail:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for navigation and static assets
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Skip external firebase APIs and dynamic API calls
  if (url.origin !== self.location.origin && !url.hostname.includes('googleapis.com') && !url.hostname.includes('gstatic.com')) {
    return;
  }

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
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
      })
  );
});

// Import Firebase Messaging for background notifications if available
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
  const firebaseConfig = {
    apiKey: "AIzaSyDh5pTDXDQ1kLOzyCkufiWcPSEo8Q6J7SY",
    authDomain: "studio-61196567-8edf5.firebaseapp.com",
    projectId: "studio-61196567-8edf5",
    storageBucket: "studio-61196567-8edf5.firebasestorage.app",
    messagingSenderId: "484094142486",
    appId: "1:484094142486:web:baldaty"
  };
  if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'بلدتي';
      const options = {
        body: (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || '',
        icon: '/public/pwa-192x192.png',
        badge: '/public/pwa-192x192.png',
        dir: 'rtl',
        lang: 'ar',
        data: payload.data
      };
      self.registration.showNotification(title, options);
    });
  }
} catch (e) {
  // Service worker background notifications fallback
}
