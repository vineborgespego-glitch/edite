
const CACHE_NAME = 'atelier-edite-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalação: Salva arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Cacheando App Shell');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interceptação de Requisições: Estratégia Cache-First para Ativos e Network-First para API
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Para chamadas de API (Supabase), tentamos rede primeiro
  if (url.origin.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Para arquivos do site (JS, CSS, Imagens), usamos Cache-First
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          // Salva dinamicamente novos arquivos no cache
          if (request.method === 'GET' && !url.protocol.includes('chrome-extension')) {
            cache.put(request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    })
  );
});
