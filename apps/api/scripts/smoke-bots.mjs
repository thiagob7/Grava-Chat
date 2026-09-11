import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

const api = async (path, { token, botToken, appToken, body, method = "POST", query } = {}) => {
  const authorization =
    (token && `Bearer ${token}`) ||
    (botToken && `Bot ${botToken}`) ||
    (appToken && `Bearer ${appToken}`);

  const res = await fetch(`${BASE}/api${path}${query ? `?${new URLSearchParams(query)}` : ""}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

const refusal = async (expected, description, fn) => {
  try {
    await fn();
    throw new Error(`FALHOU: ${description}`);
  } catch (e) {
    if (!new RegExp(`-> ${expected}`).test(e.message)) throw e;
    ok(`${description} -> ${expected}`);
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

const wait = (s, event, condition, oQue) =>
  new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error(`nao chegou: ${oQue}`)), 5000);
    s.on(event, (dado) => {
      if (!condition(dado)) return;
      clearTimeout(deadline);
      resolve(dado);
    });
  });

const owner = await api("/auth/dev-login", { body: { email: "dono-bot@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-bot@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Bots" } });
const fromZe = await api("/guilds", { token: ze.accessToken, body: { name: "Servidor do Ze" } });

const detail = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
const general = detail.channels.find((c) => c.type === "TEXT");

console.log("\n== criar ==");
const created = await api("/bots", { token: owner.accessToken, body: { name: "Ajudante" } });
if (!created.token) throw new Error("o token nao veio na criacao");
ok(`bot criado com token na mao (@${created.user.username})`);
if (!created.user.isBot) throw new Error("o usuario do bot nao esta marcado como bot");
ok("a identidade dele e um usuario marcado isBot");
if (!created.clientSecret) throw new Error("nasceu sem clientSecret");
ok("ja nasce com o par do OAuth2 (clientSecret)");

const list = await api("/bots", { token: owner.accessToken, method: "GET" });
const inList = list.find((b) => b.id === created.id);
if (inList.token) throw new Error("o token voltou na listagem");
ok("o token some depois: a listagem nao o devolve mais");
if (!inList.clientSecret) throw new Error("o segredo sumiu junto");
ok("o segredo continua visivel — sozinho ele nao fala por ninguem");

const fromOther = await api("/bots", { token: ze.accessToken, method: "GET" });
if (fromOther.some((b) => b.id === created.id)) throw new Error("o bot vazou pra lista de outra pessoa");
ok("cada pessoa so ve os proprios bots");

await refusal(403, "quem nao e dono nao edita", () =>
  api(`/bots/${created.id}`, { token: ze.accessToken, method: "PATCH", body: { name: "Sequestrado" } }),
);

console.log("\n== editar ==");
const edited = await api(`/bots/${created.id}`, {
  token: owner.accessToken,
  method: "PATCH",
  body: {
    description: "Responde !ping",
    permissionsRequested: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "VOAR"],
    isPublic: false,
    redirectUris: ["https://painel.exemplo.com/callback"],
  },
});
if (edited.permissionsRequested.includes("VOAR")) throw new Error("aceitou permissao inventada");
if (edited.permissionsRequested.length !== 3) throw new Error("perdeu as permissoes validas");
ok("permissao inventada e descartada, as validas ficam");

console.log("\n== convite ==");
const invite = await api(`/bots/${created.id}/convite`, { token: ze.accessToken, method: "GET" });
if (invite.token || invite.clientSecret) throw new Error("a tela de convite vazou segredo");
ok("qualquer pessoa logada ve o convite — sem token, sem segredo");

const destinations = await api(`/bots/${created.id}/destinos`, { token: owner.accessToken, method: "GET" });
if (!destinations.destinations.some((g) => g.id === guild.id)) throw new Error("o servidor do dono nao apareceu");
if (destinations.destinations.some((g) => g.id === fromZe.id)) throw new Error("ofereceu servidor de outra pessoa");
ok(`os destinos sao so onde o dono manda (${destinations.destinations.length})`);

await refusal(403, "bot fechado nao entra em servidor de outra pessoa", () =>
  api(`/bots/${created.id}/servidores/${fromZe.id}`, { token: ze.accessToken, method: "PUT" }),
);

await refusal(404, "quem nem e membro nao ve o servidor pra adicionar", () =>
  api(`/bots/${created.id}/servidores/${guild.id}`, { token: ze.accessToken, method: "PUT" }),
);

const inviteOwner = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${inviteOwner.code}/join`, { token: ze.accessToken });

await refusal(403, "membro sem MANAGE_GUILD nao adiciona", () =>
  api(`/bots/${created.id}/servidores/${guild.id}`, { token: ze.accessToken, method: "PUT" }),
);

console.log("\n== adicionar ==");
const entry = await api(`/bots/${created.id}/servidores/${guild.id}`, {
  token: owner.accessToken,
  method: "PUT",
});
if (!entry.roleId) throw new Error("entrou sem cargo mesmo tendo pedido permissoes");
ok("entrou com um cargo proprio, com o que pediu");

const roleList = await api(`/guilds/${guild.id}/roles`, { token: owner.accessToken, method: "GET" });
const botRole = roleList.find((c) => c.id === entry.roleId);
if (!botRole.permissions.includes("SEND_MESSAGES")) throw new Error("o cargo nasceu sem as permissoes");
ok(`o cargo aparece na tela de Cargos como qualquer outro (${botRole.name})`);

await refusal(400, "adicionar duas vezes nao duplica", () =>
  api(`/bots/${created.id}/servidores/${guild.id}`, { token: owner.accessToken, method: "PUT" }),
);

const after = await api(`/bots/${created.id}/destinos`, { token: owner.accessToken, method: "GET" });
if (after.destinations.some((g) => g.id === guild.id)) throw new Error("continuou oferecendo onde ja esta");
ok(`onde ele ja esta sai da lista (jaEstaEm: ${after.alreadyThisAt})`);

console.log("\n== o bot no ar ==");
await refusal(401, "token de bot inventado nao entra na API", () =>
  api("/bot/eu", { botToken: "nao-existe", method: "GET" }),
);

const eu = await api("/bot/eu", { botToken: created.token, method: "GET" });
if (eu.botId !== created.id) throw new Error("/bot/eu devolveu outro bot");
ok("o bot se identifica pelo proprio token");

const mineServers = await api("/bot/servidores", { botToken: created.token, method: "GET" });
if (mineServers.length !== 1) throw new Error("a lista de servidores do bot esta errada");
ok(`ele enxerga os servidores onde foi adicionado (${mineServers[0].name})`);

const channels = await api(`/bot/servidores/${guild.id}/canais`, { botToken: created.token, method: "GET" });
if (!channels.some((c) => c.id === general.id)) throw new Error("nao listou os canais");
ok(`e os canais de la, pra desenhar um <select> sem abrir socket (${channels.length})`);

await refusal(403, "servidor onde ele nao esta e invisivel", () =>
  api(`/bot/servidores/${fromZe.id}/canais`, { botToken: created.token, method: "GET" }),
);

const socketBot = await connect(`Bot ${created.token}`);
ok("entrou no gateway com 'Bot <token>', sem nunca ter feito login");

const socketOwner = await connect(owner.accessToken);
await emit(socketOwner, "channel:subscribe", { channelId: general.id });

const arrived = wait(
  socketBot,
  "message:created",
  (m) => m.channelId === general.id && m.content === "!ping",
  "a mensagem do canal no bot",
);
await emit(socketOwner, "message:send", { channelId: general.id, content: "!ping", nonce: crypto.randomUUID() });
await arrived;
ok("recebeu a mensagem do canal sem pedir subscribe — ele ja entra ouvindo");

const reply = wait(
  socketOwner,
  "message:created",
  (m) => m.author.isBot && m.content === "pong",
  "a resposta do bot",
);
socketBot.emit("message:send", { channelId: general.id, content: "pong", nonce: crypto.randomUUID() });
const pong = await reply;
if (pong.author.id !== created.user.id) throw new Error("a mensagem nao foi assinada pelo bot");
ok("respondeu no canal, assinando como ele mesmo");

console.log("\n== escrever por HTTP ==");

await refusal(401, "sem token de bot nao escreve", () =>
  api(`/bot/canais/${general.id}/mensagens`, { body: { content: "invasor" } }),
);

const viaHttp = wait(
  socketOwner,
  "message:created",
  (m) => m.content === "pong, agora por HTTP",
  "a mensagem enviada por HTTP",
);

const sent = await api(`/bot/canais/${general.id}/mensagens`, {
  botToken: created.token,
  body: { content: "pong, agora por HTTP" },
});

const inChannel = await viaHttp;
if (sent.author.id !== created.user.id) throw new Error("a mensagem HTTP nao foi assinada pelo bot");
if (inChannel.id !== sent.id) throw new Error("o evento no canal e de outra mensagem");
ok("POST no canal: gravou, assinou como o bot e o canal recebeu na hora");

const edited = wait(
  socketOwner,
  "message:updated",
  (m) => m.id === sent.id,
  "a edicao no canal",
);
const editAfter = await api(`/bot/mensagens/${sent.id}`, {
  botToken: created.token,
  method: "PATCH",
  body: { content: "pong, corrigido" },
});
await edited;
if (editAfter.content !== "pong, corrigido") throw new Error("a edicao nao pegou");
ok("PATCH edita e o canal ve a correcao");

const reacted = wait(
  socketOwner,
  "message:reactions",
  (r) => r.messageId === sent.id && r.reactions.some((x) => x.emoji === "🔥"),
  "a reacao no canal",
);
await api(`/bot/mensagens/${sent.id}/reacoes/${encodeURIComponent("🔥")}`, {
  botToken: created.token,
  method: "PUT",
});
await reacted;
ok("PUT reage com emoji no caminho, percent-encoded");

const taken = wait(
  socketOwner,
  "message:reactions",
  (r) => r.messageId === sent.id && !r.reactions.some((x) => x.emoji === "🔥"),
  "a reacao saindo",
);
await api(`/bot/mensagens/${sent.id}/reacoes/${encodeURIComponent("🔥")}`, {
  botToken: created.token,
  method: "DELETE",
});
await taken;
ok("DELETE tira a reacao");

const deleted = wait(
  socketOwner,
  "message:deleted",
  (m) => m.messageId === sent.id,
  "a mensagem sumindo do canal",
);
await api(`/bot/mensagens/${sent.id}`, { botToken: created.token, method: "DELETE" });
await deleted;
ok("DELETE apaga e o canal ve sumir");

const zeDetail = await api(`/guilds/${fromZe.id}`, { token: ze.accessToken, method: "GET" });
const zeGeneral = zeDetail.channels.find((c) => c.type === "TEXT");

await refusal(404, "canal de servidor onde o bot nao esta nem existe pra ele", () =>
  api(`/bot/canais/${zeGeneral.id}/mensagens`, { botToken: created.token, body: { content: "oi" } }),
);

console.log("\n== comandos de barra ==");

await refusal(400, "obrigatoria depois de opcional e recusada no registro", () =>
  api("/bot/comandos", {
    botToken: created.token,
    method: "PUT",
    body: {
      commands: [
        {
          name: "lembrete",
          description: "Te lembro de algo",
          options: [
            { name: "hora", description: "Quando", kind: "texto" },
            { name: "texto", description: "O que", kind: "texto", required: true },
          ],
        },
      ],
    },
  }),
);

await refusal(400, "dois comandos com o mesmo nome tambem", () =>
  api("/bot/comandos", {
    botToken: created.token,
    method: "PUT",
    body: {
      commands: [
        { name: "play", description: "Toca" },
        { name: "play", description: "Toca de novo" },
      ],
    },
  }),
);

const recorded = await api("/bot/comandos", {
  botToken: created.token,
  method: "PUT",
  body: {
    commands: [
      {
        name: "play",
        description: "Toca uma música",
        options: [{ name: "busca", description: "Nome ou link", kind: "texto", required: true }],
      },
      {
        name: "volume",
        description: "Muda o volume",
        options: [{ name: "nivel", description: "De 0 a 100", kind: "numero", required: true }],
      },
      { name: "fila", description: "Mostra a fila" },
    ],
  },
});
if (recorded.commands.length !== 3) throw new Error("nao registrou os tres");
ok("o bot registrou os comandos com um PUT so");

const fromServer = await api(`/guilds/${guild.id}/comandos`, {
  token: owner.accessToken,
  method: "GET",
});
const play = fromServer.find((c) => c.name === "play");
if (!play) throw new Error("o /play nao apareceu na lista do servidor");
if (play.bot.id !== created.user.id) throw new Error("o comando nao veio com o dono dele");
ok(`o servidor lista o que da pra digitar, com o bot de cada um (${fromServer.length})`);

await api(`/guilds/${guild.id}/comandos`, { token: ze.accessToken, method: "GET" });
ok("qualquer membro ve a lista");

await refusal(404, "quem nao e membro nao ve a lista", () =>
  api(`/guilds/${fromZe.id}/comandos`, { token: owner.accessToken, method: "GET" }),
);

const received = new Promise((resolve, reject) => {
  const deadline = setTimeout(() => reject(new Error("o comando nao chegou no bot")), 5000);
  socketBot.on("command:invoked", (dado) => {
    clearTimeout(deadline);
    resolve(dado);
  });
});

const trailChannel = wait(
  socketOwner,
  "message:created",
  (m) => m.kind === "COMANDO",
  "o rastro do comando no canal",
);

await emit(socketOwner, "command:invoke", {
  channelId: general.id,
  botId: created.id,
  command: "play",
  options: { search: "tim maia azul da cor do mar" },
});

const delivered = await received;
const trail = await trailChannel;

if (delivered.command !== "play") throw new Error("chegou outro comando");
if (delivered.options.search !== "tim maia azul da cor do mar") throw new Error("a opcao nao chegou");
if (delivered.user.id !== owner.user.id) throw new Error("nao disse quem invocou");
if (delivered.messageId !== trail.id) throw new Error("o messageId nao aponta pro rastro");
ok(`o bot recebeu o comando com a opcao ja separada (${delivered.options.search})`);

if (trail.content !== "/play tim maia azul da cor do mar") throw new Error(`rastro errado: ${trail.content}`);
if (trail.author.id !== owner.user.id) throw new Error("o rastro nao e de quem digitou");
ok(`e o canal ficou com a linha "${trail.content}", assinada por quem digitou`);

const numeric = new Promise((resolve, reject) => {
  const deadline = setTimeout(() => reject(new Error("o /volume nao chegou")), 5000);
  socketBot.on("command:invoked", (d) => (d.command === "volume" ? (clearTimeout(deadline), resolve(d)) : null));
});

await emit(socketOwner, "command:invoke", {
  channelId: general.id,
  botId: created.id,
  command: "volume",
  options: { level: "80" },
});

const withNumber = await numeric;
if (typeof withNumber.options.level !== "number") throw new Error("o numero chegou como texto");
ok("opcao de tipo numero chega numero, convertida no servidor");

const refusalEmit = async (description, payload) => {
  try {
    await emit(socketOwner, "command:invoke", payload);
    throw new Error(`FALHOU: ${description}`);
  } catch (e) {
    if (e.message.startsWith("FALHOU")) throw e;
    ok(`${description} -> ${e.message}`);
  }
};

await refusalEmit("opcao obrigatoria faltando", {
  channelId: general.id,
  botId: created.id,
  command: "play",
  options: {},
});

await refusalEmit("numero que nao e numero", {
  channelId: general.id,
  botId: created.id,
  command: "volume",
  options: { level: "alto" },
});

await refusalEmit("opcao que o comando nao declarou", {
  channelId: general.id,
  botId: created.id,
  command: "fila",
  options: { invented: "x" },
});

await refusalEmit("comando que nao existe", {
  channelId: general.id,
  botId: created.id,
  command: "inventado",
  options: {},
});

const withoutBot = await api("/guilds", { token: owner.accessToken, body: { name: "Sem o bot" } });
const detailWithoutBot = await api(`/guilds/${withoutBot.id}`, { token: owner.accessToken, method: "GET" });

await refusalEmit("bot que nao esta neste servidor", {
  channelId: detailWithoutBot.channels.find((c) => c.type === "TEXT").id,
  botId: created.id,
  command: "play",
  options: { search: "x" },
});

await api(`/guilds/${withoutBot.id}`, { token: owner.accessToken, method: "DELETE" });

console.log("\n== oauth2 ==");
const REDIRECT = "https://painel.exemplo.com/callback";

await refusal(400, "endereco de retorno nao registrado nem abre a tela", () =>
  api("/oauth2/pedido", {
    token: ze.accessToken,
    method: "GET",
    query: { client_id: created.id, redirect_uri: "https://malandro.com/pega", scope: "identify" },
  }),
);

const request = await api("/oauth2/pedido", {
  token: ze.accessToken,
  method: "GET",
  query: { client_id: created.id, redirect_uri: REDIRECT, scope: "identify guilds" },
});
if (request.scopes.length !== 2) throw new Error("os escopos nao vieram");
ok(`a tela sabe o que esta sendo pedido (${request.scopes.join(", ")})`);

const authorized = await api("/oauth2/autorizar", {
  token: ze.accessToken,
  body: { client_id: created.id, redirect_uri: REDIRECT, scope: "identify guilds" },
});
ok("a pessoa autorizou e saiu com um codigo");

await refusal(401, "segredo errado nao troca codigo por token", () =>
  api("/oauth2/token", {
    body: {
      code: authorized.code,
      client_id: created.id,
      client_secret: "chutando",
      redirect_uri: REDIRECT,
    },
  }),
);

const swapped = await api("/oauth2/token", {
  body: {
    code: authorized.code,
    client_id: created.id,
    client_secret: created.clientSecret,
    redirect_uri: REDIRECT,
  },
});
if (!swapped.access_token) throw new Error("a troca nao devolveu token");
ok(`o servidor do dev trocou o codigo por um token (expira em ${swapped.expires_in}s)`);

await refusal(401, "o codigo e de uso unico", () =>
  api("/oauth2/token", {
    body: {
      code: authorized.code,
      client_id: created.id,
      client_secret: created.clientSecret,
      redirect_uri: REDIRECT,
    },
  }),
);

const whoIs = await api("/oauth2/usuario", { appToken: swapped.access_token, method: "GET" });
if (whoIs.id !== ze.user.id) throw new Error("o token identificou outra pessoa");
ok(`o painel de fora sabe quem entrou (@${whoIs.username}) sem ver senha nem cookie`);

const serversDele = await api("/oauth2/servidores", { appToken: swapped.access_token, method: "GET" });
const yourServer = serversDele.find((g) => g.id === fromZe.id);
if (!yourServer.manages) throw new Error("nao marcou onde ele gerencia");
if (yourServer.hasBot) throw new Error("disse que o bot esta onde ele nao esta");
ok("e ve, servidor a servidor, onde ele manda e onde o bot ja esta");

console.log("\n== escopo ==");
const soIdentify = await api("/oauth2/autorizar", {
  token: ze.accessToken,
  body: { client_id: created.id, redirect_uri: REDIRECT, scope: "identify" },
});
const lean = await api("/oauth2/token", {
  body: {
    code: soIdentify.code,
    client_id: created.id,
    client_secret: created.clientSecret,
    redirect_uri: REDIRECT,
  },
});

await api("/oauth2/usuario", { appToken: lean.access_token, method: "GET" });
ok("token de escopo curto ainda diz quem e a pessoa");

await refusal(403, "mas nao alcanca o que nao foi pedido (guilds)", () =>
  api("/oauth2/servidores", { appToken: lean.access_token, method: "GET" }),
);

console.log("\n== token do bot ==");
const regenerated = await api(`/bots/${created.id}/token`, { token: owner.accessToken });
if (regenerated.token === created.token) throw new Error("gerou o mesmo token");
ok("o dono gerou outro token");

await refusal(401, "o token antigo morre na hora", () =>
  api("/bot/eu", { botToken: created.token, method: "GET" }),
);

await api("/bot/eu", { botToken: regenerated.token, method: "GET" });
ok("e o novo ja vale");

console.log("\n== sair ==");
await api(`/bots/${created.id}/servidores/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
const withoutServer = await api(`/bots/${created.id}/servidores`, { token: owner.accessToken, method: "GET" });
if (withoutServer.length) throw new Error("continuou no servidor depois de removido");
ok("removido do servidor, ele some da lista");

await api(`/bots/${created.id}`, { token: owner.accessToken, method: "DELETE" });
const leftover = await api("/bots", { token: owner.accessToken, method: "GET" });
if (leftover.some((b) => b.id === created.id)) throw new Error("o bot sobreviveu ao delete");
ok("apagado");

const account = await fetch(`${BASE}/api/users/${created.user.id}`, {
  headers: { Authorization: `Bearer ${owner.accessToken}` },
});
if (account.status !== 404) throw new Error(`o usuario-bot sobrou (status ${account.status})`);
ok("e a identidade dele vai junto — sem conta-fantasma");

socketBot.close();
socketOwner.close();
await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
await api(`/guilds/${fromZe.id}`, { token: ze.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
