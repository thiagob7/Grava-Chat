import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

const api = async (path, { token, body, method = "POST" } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

const dono = await api("/auth/dev-login", { body: { email: "dono-hook@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-hook@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Webhooks" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: ze.accessToken });

const detalhe = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
const geral = detalhe.channels.find((c) => c.type === "TEXT");
const sala = detalhe.channels.find((c) => c.type === "VOICE");

console.log("\n== criar ==");
const hook = await api(`/guilds/${guild.id}/webhooks`, {
  token: dono.accessToken,
  body: { name: "CI do projeto", channelId: geral.id },
});
if (!hook.url.includes(hook.id)) throw new Error("a URL nao contem o id");
ok(`webhook criado, com URL pronta pra copiar (${hook.url.split("/api")[1].slice(0, 24)}…)`);
if (!hook.bot?.id) throw new Error("webhook sem usuario-bot");
ok(`nasceu com um usuario-bot proprio (@${hook.bot.username})`);

await recusa(403, "quem nao tem MANAGE_WEBHOOKS nao lista", () =>
  api(`/guilds/${guild.id}/webhooks`, { token: ze.accessToken, method: "GET" }),
);

await recusa(400, "webhook nao aponta pra canal de voz", () =>
  api(`/guilds/${guild.id}/webhooks`, {
    token: dono.accessToken,
    body: { name: "Voz", channelId: sala.id },
  }),
);

console.log("\n== postar sem login ==");
const socketZe = await connect(ze.accessToken);
await emit(socketZe, "channel:subscribe", { channelId: geral.id });

const recebida = new Promise((resolve) => socketZe.once("message:created", resolve));

const postar = (body) =>
  fetch(`${BASE}/api/webhooks/${hook.id}/${hook.url.split("/").pop()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const envio = await postar({ content: "build 42 passou ✅" });
if (envio.status !== 201) throw new Error(`postar devolveu ${envio.status} ${await envio.text()}`);
ok("postou sem nenhum login, so com o token da URL");

const evento = await Promise.race([recebida, new Promise((_, r) => setTimeout(() => r(new Error("nao chegou em tempo real")), 5000))]);
if (evento.content !== "build 42 passou ✅") throw new Error("conteudo diferente");
if (evento.author.id !== hook.bot.id) throw new Error("mensagem nao esta assinada pelo bot");
ok(`chegou em tempo real pra quem esta no canal, assinada por "${evento.author.displayName}"`);

const comIdentidade = await postar({ content: "deploy em producao", username: "Deploy" });
if (comIdentidade.status !== 201) throw new Error("postar com username falhou");
const historico = await api(`/channels/${geral.id}/messages`, { token: dono.accessToken, method: "GET" });
const ultima = historico.messages.at(-1);
if (ultima.author.displayName !== "Deploy") throw new Error("username da mensagem nao foi aplicado");
ok("username por mensagem troca a identidade (formato do Discord)");

console.log("\n== recusas ==");
const tokenErrado = await fetch(`${BASE}/api/webhooks/${hook.id}/token-inventado-mas-do-tamanho-certo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: "invasao" }),
});
if (tokenErrado.status !== 401) throw new Error(`token errado devolveu ${tokenErrado.status}`);
ok("token errado -> 401");

const vazia = await postar({ content: "   " });
if (vazia.status !== 400) throw new Error(`mensagem vazia devolveu ${vazia.status}`);
ok("mensagem vazia -> 400");

const rajada = await Promise.all([1, 2, 3, 4, 5].map(() => postar({ content: "spam" })));
if (!rajada.some((r) => r.status === 429)) throw new Error("a vazao nao segurou a rajada");
ok("rajada de mensagens bate no limite de vazao -> 429");

console.log("\n== editar e apagar ==");
const movido = await api(`/guilds/${guild.id}/webhooks/${hook.id}`, {
  token: dono.accessToken,
  method: "PATCH",
  body: { name: "CI renomeado" },
});
if (movido.name !== "CI renomeado") throw new Error("nome nao mudou");
ok("renomear muda o webhook e o nome que assina as mensagens");

await api(`/guilds/${guild.id}/webhooks/${hook.id}`, { token: dono.accessToken, method: "DELETE" });
const depois = await postar({ content: "ainda funciona?" });
if (depois.status !== 404) throw new Error(`URL de webhook apagado devolveu ${depois.status}`);
ok("apagado, a URL para de funcionar (404) e o historico continua la");

const historicoFinal = await api(`/channels/${geral.id}/messages`, { token: dono.accessToken, method: "GET" });
if (historicoFinal.messages.length < 2) throw new Error("as mensagens do webhook sumiram junto");
ok(`o historico manteve as ${historicoFinal.messages.length} mensagens do bot`);

const efemero = await api(`/guilds/${guild.id}/webhooks`, {
  token: dono.accessToken,
  body: { name: "So pra testar", channelId: geral.id },
});
await api(`/guilds/${guild.id}/webhooks/${efemero.id}`, { token: dono.accessToken, method: "DELETE" });

const busca = await fetch(`${BASE}/api/users/${efemero.bot.id}`, {
  headers: { Authorization: `Bearer ${dono.accessToken}` },
});
if (busca.status !== 404) throw new Error(`o usuario-bot sobrou (status ${busca.status})`);
ok("webhook apagado sem ter postado nada nao deixa conta-fantasma");

socketZe.close();
await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
