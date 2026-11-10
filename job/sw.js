/* Clocked In service worker — scope /job/ only (the resume app is NOT cached or touched).
   Network first so updates arrive; falls back to the cached copy when the job site has no signal. */
const CACHE = 'otj-v2';
const WAIT_MS = 4000; /* weak signal: after this long, open the saved copy instead of leaving a blank screen */
const FILES = ['/job/', '/job/tax-2026.json', '/job/manifest.webmanifest', '/job/icon-192.png', '/job/icon-512.png', '/job/apple-touch-icon.png'];
/* A host may answer a page address with a redirect (for example /job/ <-> /job). A browser refuses to open a page from a
   cached answer that was redirected, so store a plain copy of what came back. */
const plain = r => r.redirected ? r.blob().then(b => new Response(b, {status: r.status, statusText: r.statusText, headers: r.headers})) : Promise.resolve(r);
self.addEventListener('install', e => {
  /* one file failing must not stop the rest from being saved for offline use */
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, {cache: 'no-cache'}).then(r => r && r.ok ? plain(r).then(x => c.put(f, x)) : null).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('otj-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/job/')) return;
  const saved = () => caches.match(e.request, {ignoreSearch: true}).then(m => m || caches.match('/job/'));
  const net = fetch(e.request).then(r => {
    if (r && r.ok) { const copy = r.clone(); plain(copy).then(x => caches.open(CACHE).then(c => c.put(u.pathname === '/job/index.html' || u.pathname === '/job/' ? '/job/' : e.request, x))).catch(() => {}); }
    return r;
  });
  /* network first; no signal -> saved copy; slow signal -> saved copy after WAIT_MS (the network answer still updates the saved copy when it lands) */
  const slow = new Promise(res => setTimeout(res, WAIT_MS)).then(saved).then(m => m || net);
  e.respondWith(Promise.race([net.catch(() => saved()), slow]));
});
