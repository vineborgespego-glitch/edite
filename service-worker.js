
const CACHE_NAME = 'atelier-edite-v3';
const OFFLINE_URL = '/index.html';

// Arquivos que o app precisa para abrir sem internet (App Shell)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Instalação: Baixa tudo para o celular
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Instalando App no Celular: Salvando arquivos offline...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa versões velhas
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

// O SEGREDO DO OFFLINE: Intercepta a tentativa de navegar
self.addEventListener('fetch', event => {
  // Ignora extensões e chrome-extension
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 1. Se o arquivo estiver no celular (cache), entrega na hora (rápido e funciona offline)
      if (cachedResponse) return cachedResponse;

      // 2. Se não estiver, tenta buscar na internet e salva uma cópia para a próxima vez
      return fetch(event.request).then(networkResponse => {
        // Não salva respostas de API (Supabase) no cache estático
        if (!event.request.url.includes('supabase.co') && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // 3. Se falhar a rede E não tiver no cache (ex: página nova), mostra a página inicial salva
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
