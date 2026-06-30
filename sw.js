// ─── Service Worker ─────────────────────────────────────────────────────────
// Estratégia SIMPLIFICADA (otimizada para Android):
//   • Somente index.html e ícones são cacheados (app shell mínimo)
//   • JS/CSS/outros: passam direto pela rede — sem cache no SW
//   • Isso evita pressão de memória em dispositivos Android
// ────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v2.86';
const CACHE_NAME    = `impacto-shell-${CACHE_VERSION}`;
const BASE_PATH     = '/impacto';

const SHELL_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/favicon.png`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`,
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log(`🔧 SW ${CACHE_VERSION}: instalando...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpa caches antigos ──────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log(`✅ SW ${CACHE_VERSION}: ativo`);
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  // Ignora POST e externos (Firebase, CDNs, fontes)
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.hostname !== self.location.hostname) return;

  // JS e CSS: passa direto pela rede (sem cache SW — browser HTTP cache já faz isso)
  // Isso evita acumular MB de cache na memória do celular
  const pathname = url.pathname;
  if (pathname.endsWith('.js') || pathname.endsWith('.css')) return;

  // Ícones e manifest: Cache First (não mudam)
  const isShellAsset = pathname.endsWith('.png') || pathname.endsWith('.ico')
    || pathname.endsWith('manifest.json') || pathname.endsWith('.webp');
  if (isShellAsset) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request)
          .then(res => {
            if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone())).catch(() => {});
            return res;
          })
        )
    );
    return;
  }

  // Navegação (HTML): rede primeiro, fallback para index.html em cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match(`${BASE_PATH}/index.html`))
    );
  }
});

// ── Mensagens da página ──────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_CACHE_VERSION' && event.ports?.[0]) {
    event.ports[0].postMessage({ cacheVersion: CACHE_VERSION });
  }
});

console.log(`🚀 SW ${CACHE_VERSION} carregado`);
