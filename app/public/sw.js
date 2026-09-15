// Service worker mínimo — só existe pra satisfazer o critério de
// instalabilidade do Chrome/Android ("Adicionar à tela inicial" com barra de
// navegador escondida). Não faz cache agressivo de nada: cada requisição
// vai direto pra rede, então o app sempre carrega a versão mais recente.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
