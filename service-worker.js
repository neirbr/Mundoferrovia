/*
 * Mundo Ferroviário — suporte offline
 * Estratégia: pré-cache dos arquivos essenciais + rede primeiro
 * para navegações e cache como alternativa quando estiver sem conexão.
 */
const CACHE_NAME = "mundo-ferroviario-v9";

const APP_SHELL = [
  "./",
  "./index.html",
  "./admin.html",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",

  // Aplicação principal e módulos locais
  "./firebase-config.js",
  "./firebase-init.js?v=2026110301",
  "./comunidade.js?v=202611032000",
  "./enciclopedia.js?v=2026112301",
  "./ranking.js?v=2026110701",
  "./idiomas.js?v=2026112302",

  // Simuladores independentes
  "./simulador-2d.html",
  "./simulador-topdown.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("mundo-ferroviario-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function guardarResposta(request, response) {
  if (!response || !response.ok || response.type === "opaque") {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Não intercepta Firebase, Cloudinary ou outros serviços externos.
  if (url.origin !== self.location.origin) return;

  // Somente páginas HTML recebem a página inicial como fallback.
  const isNavigation = request.mode === "navigate";

  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: "no-store" });

      if (response.ok) {
        await guardarResposta(request, response);
      }

      return response;
    } catch (error) {
      const cached = await caches.match(request);

      if (cached) return cached;

      if (isNavigation) {
        const home = await caches.match("./index.html");
        if (home) return home;
      }

      return new Response(
        isNavigation
          ? "Você está offline e esta página ainda não foi armazenada neste aparelho. Abra o Mundo Ferroviário com internet uma vez para preparar o acesso offline."
          : "Este recurso ainda não está disponível offline.",
        {
          status: 503,
          statusText: "Offline",
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        }
      );
    }
  })());
});
