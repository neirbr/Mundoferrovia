const CACHE_NAME = 'mundo-ferroviario-v8';

const FILES = [
  './',
  './index.html',
  './admin.html',
  './firebase-config.js',
  './firebase-init.js',
  './comunidade.js?v=2026110301',
  './manifest.json',
  './icon.svg'
];

// INSTALAR NOVA VERSÃO
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// ATIVAR E LIMPAR CACHES ANTIGOS
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith('mundo-ferroviario-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// REDE PRIMEIRO, CACHE COMO ALTERNATIVA
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(new Request(request, {
      cache: 'no-store'
    }))
      .then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      })
      .catch(async () => {
        return await caches.match(request) ||
          await caches.match('./index.html');
      })
  );
});
