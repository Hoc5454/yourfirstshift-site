/* On the Job service worker — scope /job/ only (the resume app is NOT cached or touched).
   Network first so updates arrive; falls back to the cached copy when the job site has no signal. */
const CACHE = 'otj-v1';
const FILES = ['/job/', '/job/index.html', '/job/tax-2026.json', '/job/manifest.webmanifest', '/job/icon-192.png', '/job/icon-512.png', '/job/apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('otj-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/job/')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(u.pathname === '/job/index.html' ? '/job/' : e.request, copy)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(m => m || caches.match('/job/')))
  );
});
