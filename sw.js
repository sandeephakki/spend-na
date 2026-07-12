const C = 'sn-v5';
const APP_VER = '5.5';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.add('/').catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r =>
      r || fetch(e.request).then(res => {
        if (res && res.status === 200) {
          caches.open(C).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => r || new Response('Offline', { status: 503 }))
    )
  );
});
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'GET_VERSION') {
    e.ports[0].postMessage({ version: APP_VER, cache: C });
  }
});
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'Spend-na', body: 'Check your spends!' };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, tag: 'sn' }));
});
