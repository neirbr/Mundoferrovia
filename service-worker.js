
const CACHE_NAME = 'mundo-ferroviario-cache';

const FILES = [
  './',
  './index.html',
  './admin.html',
  './firebase-config.js',
  './firebase-init.js',
  './manifest.json',
  './icon.svg'
];

// INSTALAR E ATUALIZAR ARQUIVOS
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// ATIVAR NOVA VERSÃO
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


 // SISTEMA DE CACHE AUTOMÁTICO
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(new Request(request, {
      cache: 'no-cache'
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
