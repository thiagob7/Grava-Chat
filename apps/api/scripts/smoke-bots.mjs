import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

const api = async (path, { token, botToken, appToken, body, method = "POST", query } = {}) => {
  const autorizacao =
    (token && `Bearer ${token}`) ||
    (botToken && `Bot ${botToken}`) ||
    (appToken && `Bearer ${appToken}`);

  const res = await fetch(`${BASE}/api${path}${query ? `?${new URLSearchParams(query)}` : ""}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(autorizacao ? { Authorization: autorizacao } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

const recusa = async (esperado, descricao, fn) => {
  try {
    await fn();
    throw new Error(`FALHOU: ${descricao}`);
  } catch (e) {
    if (!new RegExp(`-> ${esperado}`).test(e.message)) throw e;
    ok(`${descricao} -> ${esperado}`);
  }
};

const connect = (token) =>
  new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ["websocket"] });
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });

const emit = (s, ev, payload) =>
  new Promise((resolve, reject) =>
    s.emit(ev, payload, (r) => (r.ok ? resolve(r.data) : reject(new Error(r.error)))),
  );

const esperar = (s, evento, condicao, oQue) =>
  new Promise((resolve, reject) => {
    const prazo = setTimeout(() => reject(new Error(`nao chegou: ${oQue}`)), 5000);
    s.on(evento, (dado) => {
      if (!condicao(dado)) return;
      clearTimeout(prazo);
      resolve(dado);
    });
  });

const dono = await api("/auth/dev-login", { body: { email: "dono-bot@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-bot@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Bots" } });
const doZe = await api("/guilds", { token: ze.accessToken, body: { name: "Servidor do Ze" } });

const detalhe = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
const geral = detalhe.channels.find((c) => c.type === "TEXT");

console.log("\n== criar ==");
const criado = await api("/bots", { token: dono.accessToken, body: { nome: "Ajudante" } });
if (!criado.token) throw new Error("o token nao veio na criacao");
ok(`bot criado com token na mao (@${criado.usuario.username})`);
if (!criado.usuario.isBot) throw new Error("o usuario do bot nao esta marcado como bot");
ok("a identidade dele e um usuario marcado isBot");
if (!criado.clientSecret) throw new Error("nasceu sem clientSecret");
ok("ja nasce com o par do OAuth2 (clientSecret)");

const lista = await api("/bots", { token: dono.accessToken, method: "GET" });
const naLista = lista.find((b) => b.id === criado.id);
if (naLista.token) throw new Error("o token voltou na listagem");
ok("o token some depois: a listagem nao o devolve mais");
if (!naLista.clientSecret) throw new Error("o segredo sumiu junto");
ok("o segredo continua visivel — sozinho ele nao fala por ninguem");

const deOutro = await api("/bots", { token: ze.accessToken, method: "GET" });
if (deOutro.some((b) => b.id === criado.id)) throw new Error("o bot vazou pra lista de outra pessoa");
ok("cada pessoa so ve os proprios bots");

await recusa(403, "quem nao e dono nao edita", () =>
  api(`/bots/${criado.id}`, { token: ze.accessToken, method: "PATCH", body: { nome: "Sequestrado" } }),
);

console.log("\n== editar ==");
const editado = await api(`/bots/${criado.id}`, {
  token: dono.accessToken,
  method: "PATCH",
  body: {
    descricao: "Responde !ping",
    permissoesPedidas: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "VOAR"],
    publico: false,
    redirectUris: ["https://painel.exemplo.com/callback"],
  },
});
if (editado.permissoesPedidas.includes("VOAR")) throw new Error("aceitou permissao inventada");
if (editado.permissoesPedidas.length !== 3) throw new Error("perdeu as permissoes validas");
ok("permissao inventada e descartada, as validas ficam");

console.log("\n== convite ==");
const convite = await api(`/bots/${criado.id}/convite`, { token: ze.accessToken, method: "GET" });
if (convite.token || convite.clientSecret) throw new Error("a tela de convite vazou segredo");
ok("qualquer pessoa logada ve o convite — sem token, sem segredo");

const destinos = await api(`/bots/${criado.id}/destinos`, { token: dono.accessToken, method: "GET" });
if (!destinos.destinos.some((g) => g.id === guild.id)) throw new Error("o servidor do dono nao apareceu");
if (destinos.destinos.some((g) => g.id === doZe.id)) throw new Error("ofereceu servidor de outra pessoa");
ok(`os destinos sao so onde o dono manda (${destinos.destinos.length})`);

await recusa(403, "bot fechado nao entra em servidor de outra pessoa", () =>
  api(`/bots/${criado.id}/servidores/${doZe.id}`, { token: ze.accessToken, method: "PUT" }),
);

await recusa(404, "quem nem e membro nao ve o servidor pra adicionar", () =>
  api(`/bots/${criado.id}/servidores/${guild.id}`, { token: ze.accessToken, method: "PUT" }),
);

/// O Ze precisa ESTAR no servidor para o proximo caso valer: sem isso ele
/// esbarra em "nao e membro" e a permissao nunca chega a ser consultada.
const conviteDoDono = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${conviteDoDono.code}/join`, { token: ze.accessToken });

await recusa(403, "membro sem MANAGE_GUILD nao adiciona", () =>
  api(`/bots/${criado.id}/servidores/${guild.id}`, { token: ze.accessToken, method: "PUT" }),
);

console.log("\n== adicionar ==");
const entrada = await api(`/bots/${criado.id}/servidores/${guild.id}`, {
  token: dono.accessToken,
  method: "PUT",
});
if (!entrada.roleId) throw new Error("entrou sem cargo mesmo tendo pedido permissoes");
ok("entrou com um cargo proprio, com o que pediu");

const cargos = await api(`/guilds/${guild.id}/roles`, { token: dono.accessToken, method: "GET" });
const cargoDoBot = cargos.find((c) => c.id === entrada.roleId);
if (!cargoDoBot.permissions.includes("SEND_MESSAGES")) throw new Error("o cargo nasceu sem as permissoes");
ok(`o cargo aparece na tela de Cargos como qualquer outro (${cargoDoBot.name})`);

await recusa(400, "adicionar duas vezes nao duplica", () =>
  api(`/bots/${criado.id}/servidores/${guild.id}`, { token: dono.accessToken, method: "PUT" }),
);

const depois = await api(`/bots/${criado.id}/destinos`, { token: dono.accessToken, method: "GET" });
if (depois.destinos.some((g) => g.id === guild.id)) throw new Error("continuou oferecendo onde ja esta");
ok(`onde ele ja esta sai da lista (jaEstaEm: ${depois.jaEstaEm})`);

console.log("\n== o bot no ar ==");
await recusa(401, "token de bot inventado nao entra na API", () =>
  api("/bot/eu", { botToken: "nao-existe", method: "GET" }),
);

const eu = await api("/bot/eu", { botToken: criado.token, method: "GET" });
if (eu.botId !== criado.id) throw new Error("/bot/eu devolveu outro bot");
ok("o bot se identifica pelo proprio token");

const meusServidores = await api("/bot/servidores", { botToken: criado.token, method: "GET" });
if (meusServidores.length !== 1) throw new Error("a lista de servidores do bot esta errada");
ok(`ele enxerga os servidores onde foi adicionado (${meusServidores[0].name})`);

const canais = await api(`/bot/servidores/${guild.id}/canais`, { botToken: criado.token, method: "GET" });
if (!canais.some((c) => c.id === geral.id)) throw new Error("nao listou os canais");
ok(`e os canais de la, pra desenhar um <select> sem abrir socket (${canais.length})`);

await recusa(403, "servidor onde ele nao esta e invisivel", () =>
  api(`/bot/servidores/${doZe.id}/canais`, { botToken: criado.token, method: "GET" }),
);

const socketBot = await connect(`Bot ${criado.token}`);
ok("entrou no gateway com 'Bot <token>', sem nunca ter feito login");

const socketDono = await connect(dono.accessToken);
await emit(socketDono, "channel:subscribe", { channelId: geral.id });

const chegou = esperar(
  socketBot,
  "message:created",
  (m) => m.channelId === geral.id && m.content === "!ping",
  "a mensagem do canal no bot",
);
await emit(socketDono, "message:send", { channelId: geral.id, content: "!ping", nonce: crypto.randomUUID() });
await chegou;
ok("recebeu a mensagem do canal sem pedir subscribe — ele ja entra ouvindo");

const resposta = esperar(
  socketDono,
  "message:created",
  (m) => m.author.isBot && m.content === "pong",
  "a resposta do bot",
);
socketBot.emit("message:send", { channelId: geral.id, content: "pong", nonce: crypto.randomUUID() });
const pong = await resposta;
if (pong.author.id !== criado.usuario.id) throw new Error("a mensagem nao foi assinada pelo bot");
ok("respondeu no canal, assinando como ele mesmo");

console.log("\n== escrever por HTTP ==");

/*
  A mesma escrita, pela outra porta.

  O que importa aqui nao e so o 201: e o socketDono receber o evento. Gravar
  sem avisar deixaria a mensagem no banco e a tela de todo mundo parada ate
  alguem dar refresh — e um teste que so olha o status nao veria isso.
*/
await recusa(401, "sem token de bot nao escreve", () =>
  api(`/bot/canais/${geral.id}/mensagens`, { body: { content: "invasor" } }),
);

const viaHttp = esperar(
  socketDono,
  "message:created",
  (m) => m.content === "pong, agora por HTTP",
  "a mensagem enviada por HTTP",
);

const mandada = await api(`/bot/canais/${geral.id}/mensagens`, {
  botToken: criado.token,
  body: { content: "pong, agora por HTTP" },
});

const noCanal = await viaHttp;
if (mandada.author.id !== criado.usuario.id) throw new Error("a mensagem HTTP nao foi assinada pelo bot");
if (noCanal.id !== mandada.id) throw new Error("o evento no canal e de outra mensagem");
ok("POST no canal: gravou, assinou como o bot e o canal recebeu na hora");

const editada = esperar(
  socketDono,
  "message:updated",
  (m) => m.id === mandada.id,
  "a edicao no canal",
);
const depoisDaEdicao = await api(`/bot/mensagens/${mandada.id}`, {
  botToken: criado.token,
  method: "PATCH",
  body: { content: "pong, corrigido" },
});
await editada;
if (depoisDaEdicao.content !== "pong, corrigido") throw new Error("a edicao nao pegou");
ok("PATCH edita e o canal ve a correcao");

const reagida = esperar(
  socketDono,
  "message:reactions",
  (r) => r.messageId === mandada.id && r.reactions.some((x) => x.emoji === "🔥"),
  "a reacao no canal",
);
await api(`/bot/mensagens/${mandada.id}/reacoes/${encodeURIComponent("🔥")}`, {
  botToken: criado.token,
  method: "PUT",
});
await reagida;
ok("PUT reage com emoji no caminho, percent-encoded");

const tirada = esperar(
  socketDono,
  "message:reactions",
  (r) => r.messageId === mandada.id && !r.reactions.some((x) => x.emoji === "🔥"),
  "a reacao saindo",
);
await api(`/bot/mensagens/${mandada.id}/reacoes/${encodeURIComponent("🔥")}`, {
  botToken: criado.token,
  method: "DELETE",
});
await tirada;
ok("DELETE tira a reacao");

const apagada = esperar(
  socketDono,
  "message:deleted",
  (m) => m.messageId === mandada.id,
  "a mensagem sumindo do canal",
);
await api(`/bot/mensagens/${mandada.id}`, { botToken: criado.token, method: "DELETE" });
await apagada;
ok("DELETE apaga e o canal ve sumir");

/// A permissao nao e checada na rota: quem cobra e o messageService, o mesmo
/// que cobra de qualquer pessoa. Este caso e o que prova isso.
const detalheDoZe = await api(`/guilds/${doZe.id}`, { token: ze.accessToken, method: "GET" });
const geralDoZe = detalheDoZe.channels.find((c) => c.type === "TEXT");

/// 404, e nao 403: um canal onde o bot nao entra nem existe, do ponto de
/// vista dele. Responder "proibido" ja confirmaria que o id e real.
await recusa(404, "canal de servidor onde o bot nao esta nem existe pra ele", () =>
  api(`/bot/canais/${geralDoZe.id}/mensagens`, { botToken: criado.token, body: { content: "oi" } }),
);

console.log("\n== comandos de barra ==");

await recusa(400, "obrigatoria depois de opcional e recusada no registro", () =>
  api("/bot/comandos", {
    botToken: criado.token,
    method: "PUT",
    body: {
      comandos: [
        {
          nome: "lembrete",
          descricao: "Te lembro de algo",
          opcoes: [
            { nome: "hora", descricao: "Quando", tipo: "texto" },
            { nome: "texto", descricao: "O que", tipo: "texto", obrigatoria: true },
          ],
        },
      ],
    },
  }),
);

await recusa(400, "dois comandos com o mesmo nome tambem", () =>
  api("/bot/comandos", {
    botToken: criado.token,
    method: "PUT",
    body: {
      comandos: [
        { nome: "play", descricao: "Toca" },
        { nome: "play", descricao: "Toca de novo" },
      ],
    },
  }),
);

const registrados = await api("/bot/comandos", {
  botToken: criado.token,
  method: "PUT",
  body: {
    comandos: [
      {
        nome: "play",
        descricao: "Toca uma música",
        opcoes: [{ nome: "busca", descricao: "Nome ou link", tipo: "texto", obrigatoria: true }],
      },
      {
        nome: "volume",
        descricao: "Muda o volume",
        opcoes: [{ nome: "nivel", descricao: "De 0 a 100", tipo: "numero", obrigatoria: true }],
      },
      { nome: "fila", descricao: "Mostra a fila" },
    ],
  },
});
if (registrados.comandos.length !== 3) throw new Error("nao registrou os tres");
ok("o bot registrou os comandos com um PUT so");

const doServidor = await api(`/guilds/${guild.id}/comandos`, {
  token: dono.accessToken,
  method: "GET",
});
const play = doServidor.find((c) => c.nome === "play");
if (!play) throw new Error("o /play nao apareceu na lista do servidor");
if (play.bot.id !== criado.usuario.id) throw new Error("o comando nao veio com o dono dele");
ok(`o servidor lista o que da pra digitar, com o bot de cada um (${doServidor.length})`);

/// O Ze é membro do servidor (entrou pelo convite lá em cima), então ele vê
/// os comandos — quem não é membro nem enxerga o servidor.
await api(`/guilds/${guild.id}/comandos`, { token: ze.accessToken, method: "GET" });
ok("qualquer membro ve a lista");

await recusa(404, "quem nao e membro nao ve a lista", () =>
  api(`/guilds/${doZe.id}/comandos`, { token: dono.accessToken, method: "GET" }),
);

/// O bot precisa estar ouvindo para receber a invocação.
const recebido = new Promise((resolve, reject) => {
  const prazo = setTimeout(() => reject(new Error("o comando nao chegou no bot")), 5000);
  socketBot.on("command:invoked", (dado) => {
    clearTimeout(prazo);
    resolve(dado);
  });
});

const rastroNoCanal = esperar(
  socketDono,
  "message:created",
  (m) => m.tipo === "COMANDO",
  "o rastro do comando no canal",
);

await emit(socketDono, "command:invoke", {
  channelId: geral.id,
  botId: criado.id,
  comando: "play",
  opcoes: { busca: "tim maia azul da cor do mar" },
});

const entregue = await recebido;
const rastro = await rastroNoCanal;

if (entregue.comando !== "play") throw new Error("chegou outro comando");
if (entregue.opcoes.busca !== "tim maia azul da cor do mar") throw new Error("a opcao nao chegou");
if (entregue.usuario.id !== dono.user.id) throw new Error("nao disse quem invocou");
if (entregue.messageId !== rastro.id) throw new Error("o messageId nao aponta pro rastro");
ok(`o bot recebeu o comando com a opcao ja separada (${entregue.opcoes.busca})`);

if (rastro.content !== "/play tim maia azul da cor do mar") throw new Error(`rastro errado: ${rastro.content}`);
if (rastro.author.id !== dono.user.id) throw new Error("o rastro nao e de quem digitou");
ok(`e o canal ficou com a linha "${rastro.content}", assinada por quem digitou`);

/// A conversão é do servidor, e é o motivo de existir tipo na opção.
const numerico = new Promise((resolve, reject) => {
  const prazo = setTimeout(() => reject(new Error("o /volume nao chegou")), 5000);
  socketBot.on("command:invoked", (d) => (d.comando === "volume" ? (clearTimeout(prazo), resolve(d)) : null));
});

await emit(socketDono, "command:invoke", {
  channelId: geral.id,
  botId: criado.id,
  comando: "volume",
  opcoes: { nivel: "80" },
});

const comNumero = await numerico;
if (typeof comNumero.opcoes.nivel !== "number") throw new Error("o numero chegou como texto");
ok("opcao de tipo numero chega numero, convertida no servidor");

const recusaEmit = async (descricao, payload) => {
  try {
    await emit(socketDono, "command:invoke", payload);
    throw new Error(`FALHOU: ${descricao}`);
  } catch (e) {
    if (e.message.startsWith("FALHOU")) throw e;
    ok(`${descricao} -> ${e.message}`);
  }
};

await recusaEmit("opcao obrigatoria faltando", {
  channelId: geral.id,
  botId: criado.id,
  comando: "play",
  opcoes: {},
});

await recusaEmit("numero que nao e numero", {
  channelId: geral.id,
  botId: criado.id,
  comando: "volume",
  opcoes: { nivel: "alto" },
});

await recusaEmit("opcao que o comando nao declarou", {
  channelId: geral.id,
  botId: criado.id,
  comando: "fila",
  opcoes: { inventada: "x" },
});

await recusaEmit("comando que nao existe", {
  channelId: geral.id,
  botId: criado.id,
  comando: "inventado",
  opcoes: {},
});

/// Servidor do dono onde o bot NAO foi adicionado: ele enxerga o canal, mas
/// o bot nao esta la para ser acionado.
const semBot = await api("/guilds", { token: dono.accessToken, body: { name: "Sem o bot" } });
const detalheSemBot = await api(`/guilds/${semBot.id}`, { token: dono.accessToken, method: "GET" });

await recusaEmit("bot que nao esta neste servidor", {
  channelId: detalheSemBot.channels.find((c) => c.type === "TEXT").id,
  botId: criado.id,
  comando: "play",
  opcoes: { busca: "x" },
});

await api(`/guilds/${semBot.id}`, { token: dono.accessToken, method: "DELETE" });

console.log("\n== oauth2 ==");
const REDIRECT = "https://painel.exemplo.com/callback";

await recusa(400, "endereco de retorno nao registrado nem abre a tela", () =>
  api("/oauth2/pedido", {
    token: ze.accessToken,
    method: "GET",
    query: { client_id: criado.id, redirect_uri: "https://malandro.com/pega", scope: "identify" },
  }),
);

const pedido = await api("/oauth2/pedido", {
  token: ze.accessToken,
  method: "GET",
  query: { client_id: criado.id, redirect_uri: REDIRECT, scope: "identify guilds" },
});
if (pedido.escopos.length !== 2) throw new Error("os escopos nao vieram");
ok(`a tela sabe o que esta sendo pedido (${pedido.escopos.join(", ")})`);

const autorizado = await api("/oauth2/autorizar", {
  token: ze.accessToken,
  body: { client_id: criado.id, redirect_uri: REDIRECT, scope: "identify guilds" },
});
ok("a pessoa autorizou e saiu com um codigo");

await recusa(401, "segredo errado nao troca codigo por token", () =>
  api("/oauth2/token", {
    body: {
      code: autorizado.codigo,
      client_id: criado.id,
      client_secret: "chutando",
      redirect_uri: REDIRECT,
    },
  }),
);

const trocado = await api("/oauth2/token", {
  body: {
    code: autorizado.codigo,
    client_id: criado.id,
    client_secret: criado.clientSecret,
    redirect_uri: REDIRECT,
  },
});
if (!trocado.access_token) throw new Error("a troca nao devolveu token");
ok(`o servidor do dev trocou o codigo por um token (expira em ${trocado.expires_in}s)`);

await recusa(401, "o codigo e de uso unico", () =>
  api("/oauth2/token", {
    body: {
      code: autorizado.codigo,
      client_id: criado.id,
      client_secret: criado.clientSecret,
      redirect_uri: REDIRECT,
    },
  }),
);

const quemEh = await api("/oauth2/usuario", { appToken: trocado.access_token, method: "GET" });
if (quemEh.id !== ze.user.id) throw new Error("o token identificou outra pessoa");
ok(`o painel de fora sabe quem entrou (@${quemEh.username}) sem ver senha nem cookie`);

const servidoresDele = await api("/oauth2/servidores", { appToken: trocado.access_token, method: "GET" });
const seuServidor = servidoresDele.find((g) => g.id === doZe.id);
if (!seuServidor.gerencia) throw new Error("nao marcou onde ele gerencia");
if (seuServidor.temOBot) throw new Error("disse que o bot esta onde ele nao esta");
ok("e ve, servidor a servidor, onde ele manda e onde o bot ja esta");

console.log("\n== escopo ==");
const soIdentify = await api("/oauth2/autorizar", {
  token: ze.accessToken,
  body: { client_id: criado.id, redirect_uri: REDIRECT, scope: "identify" },
});
const magro = await api("/oauth2/token", {
  body: {
    code: soIdentify.codigo,
    client_id: criado.id,
    client_secret: criado.clientSecret,
    redirect_uri: REDIRECT,
  },
});

await api("/oauth2/usuario", { appToken: magro.access_token, method: "GET" });
ok("token de escopo curto ainda diz quem e a pessoa");

await recusa(403, "mas nao alcanca o que nao foi pedido (guilds)", () =>
  api("/oauth2/servidores", { appToken: magro.access_token, method: "GET" }),
);

console.log("\n== token do bot ==");
const regerado = await api(`/bots/${criado.id}/token`, { token: dono.accessToken });
if (regerado.token === criado.token) throw new Error("gerou o mesmo token");
ok("o dono gerou outro token");

await recusa(401, "o token antigo morre na hora", () =>
  api("/bot/eu", { botToken: criado.token, method: "GET" }),
);

await api("/bot/eu", { botToken: regerado.token, method: "GET" });
ok("e o novo ja vale");

console.log("\n== sair ==");
await api(`/bots/${criado.id}/servidores/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
const semServidor = await api(`/bots/${criado.id}/servidores`, { token: dono.accessToken, method: "GET" });
if (semServidor.length) throw new Error("continuou no servidor depois de removido");
ok("removido do servidor, ele some da lista");

await api(`/bots/${criado.id}`, { token: dono.accessToken, method: "DELETE" });
const restou = await api("/bots", { token: dono.accessToken, method: "GET" });
if (restou.some((b) => b.id === criado.id)) throw new Error("o bot sobreviveu ao delete");
ok("apagado");

const conta = await fetch(`${BASE}/api/users/${criado.usuario.id}`, {
  headers: { Authorization: `Bearer ${dono.accessToken}` },
});
if (conta.status !== 404) throw new Error(`o usuario-bot sobrou (status ${conta.status})`);
ok("e a identidade dele vai junto — sem conta-fantasma");

socketBot.close();
socketDono.close();
await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
await api(`/guilds/${doZe.id}`, { token: ze.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
