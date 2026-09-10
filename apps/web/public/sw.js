/*
  Service worker mínimo, escrito à mão de propósito.

  Ele existe por dois motivos: sem um `fetch` registrado o Chrome não oferece
  instalar o app, e sem cache a tela fica em branco quando a rede cai no meio
  de uma navegação.

  A estratégia é diferente por tipo de pedido, e é isso que evita o pior
  problema de service worker em app com build versionado: servir a casca
  antiga para sempre.

  - Navegação: rede primeiro. Só cai no cache se a rede falhar de verdade.
    Assim uma publicação nova aparece na primeira vez que a pessoa abre.
  - Arquivos de /assets/: cache primeiro. O nome deles carrega o hash do
    conteúdo, então um arquivo com aquele nome nunca muda — e o que muda ganha
    outro nome, que não está no cache.
  - Todo o resto, incluindo /api e /socket.io: passa direto, sem tocar.
*/
const VERSAO = "gravae-v1";
const CASCA = "/index.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSAO).then((cache) => cache.addAll([CASCA])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;

  if (pedido.method !== "GET") return;

  const url = new URL(pedido.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/socket.io")) return;

  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((cache) => cache.put(CASCA, copia));
          return resposta;
        })
        .catch(() => caches.match(CASCA).then((c) => c || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    evento.respondWith(
      caches.match(pedido).then(
        (guardado) =>
          guardado ||
          fetch(pedido).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(VERSAO).then((cache) => cache.put(pedido, copia));
            }

            return resposta;
          }),
      ),
    );
  }
});
