// Service worker do TCF Canada — CE.
// Objetivo simples: deixar o app instalável (PWA) e funcionar offline
// depois da primeira visita, guardando o "casco" do app em cache.
//
// IMPORTANTE: sempre que o conteúdo do app mudar de forma relevante,
// troque o número da versão abaixo (CACHE_NAME) para forçar os
// dispositivos a baixarem a versão nova em vez de continuar servindo
// a versão antiga que ficou em cache.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'tcf-ce-' + CACHE_VERSION;

const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

// Estratégia: tenta a rede primeiro (pra sempre pegar a versão mais
// nova quando há internet); se falhar (sem conexão), cai pro cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
