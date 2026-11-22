// Spider Jockey service worker: own cache, scope is /spider/ so it never shares the 2D/3D cache.
// Bump VERSION on every deploy that changes cached files (old caches are deleted on activate).
const VERSION = 'sj-pwa-2026-11-22c'; // Spider Jockey v0.3
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/sj-192.png', './icons/sj-512.png'];
const CDN = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js'
];
self.addEventListener('install', e => {
  e.waitUntil((async () => { const c = await caches.open(VERSION); await c.addAll(SHELL);
    for (const u of CDN) { try { const r = await fetch(u, { mode: 'cors' }); if (r.ok) await c.put(u, r); } catch (_) {} }
    await self.skipWaiting(); })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k); await self.clients.claim(); })());
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.webmanifest')) {
    e.respondWith((async () => { const c = await caches.open(VERSION);
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok && url.origin === location.origin) c.put(req, r.clone()); return r; }
      catch (_) { return (await c.match(req, { ignoreSearch: true })) || (await c.match('./index.html')) || Response.error(); } })());
    return;
  }
  if (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith((async () => { const c = await caches.open(VERSION); const hit = await c.match(req, { ignoreSearch: url.origin === location.origin });
      if (hit) return hit; const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r; })());
  }
});
