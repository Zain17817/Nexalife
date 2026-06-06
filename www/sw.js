const CACHE = 'nexalife-v1';
const URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/css/dashboard.css',
  '/assets/css/transaction.css',
  '/assets/js/chart.umd.min.js',
  '/assets/js/database.js',
  '/assets/js/task.js',
  '/assets/js/transaction.js',
  '/assets/js/ui.js',
  '/assets/js/chart-config.js',
  '/assets/js/app.js',
  '/assets/images/logo-nexalife.png',
  '/assets/images/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
