// ─── Service Worker ─────────────────────────────────────────────────────────
// Estratégia: Network First para JS/HTML (garante código atualizado),
//             Cache First apenas para assets estáticos (ícones, fontes).
//
// IMPORTANTE: incremente CACHE_VERSION a cada deploy para forçar atualização.
// ────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v2.37';
const CACHE_NAME    = `orcamentos-inpacto-${CACHE_VERSION}`;
const BASE_PATH     = '/inpacto';

// Recursos que precisam estar offline (estratégia Cache First para assets)
const STATIC_ASSETS = [
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.png`,
  `${BASE_PATH}/icon-180.png`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`
];

// ── Install: pré-cacheia apenas assets estáticos ─────────────────────────────
self.addEventListener('install', event => {
  console.log(`🔧 SW ${CACHE_VERSION}: Instalando...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting()) // Ativa imediatamente sem esperar fechar abas
  );
});

// ── Activate: apaga todos os caches antigos ───────────────────────────────────
self.addEventListener('activate', event => {
  console.log(`✅ SW ${CACHE_VERSION}: Ativando, limpando caches antigos...`);
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('🗑️ Deletando cache antigo:', name);
            return caches.delete(name);
          })
      ))
      .then(() => self.clients.claim()) // Assume controle de todas as abas abertas
  );
});

// ── Fetch: Network First para JS/HTML, Cache First para assets estáticos ──────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignora requisições externas (Firebase, CDNs etc.)
  if (!url.origin.includes(self.location.hostname)) {
    return;
  }

  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  const isAsset = STATIC_ASSETS.some(a => url.pathname === a);

  if (isAsset) {
    // Cache First para assets estáticos (ícones)
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  } else {
    // Network First para todo o resto (JS, HTML, CSS)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Atualiza o cache com a versão mais recente
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Sem rede → serve do cache (modo offline)
          return caches.match(event.request)
            .then(cached => cached || caches.match(`${BASE_PATH}/index.html`));
        })
    );
  }
});

// ── Mensagem da página para forçar atualização ou consultar versão ───────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_CACHE_VERSION' && event.ports && event.ports[0]) {
    event.ports[0].postMessage({ cacheVersion: CACHE_VERSION });
  }
});

console.log(`🚀 Service Worker ${CACHE_VERSION} carregado!`);
