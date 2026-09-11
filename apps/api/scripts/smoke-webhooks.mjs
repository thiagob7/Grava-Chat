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

const owner = await api("/auth/dev-login", { body: { email: "dono-hook@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-hook@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Webhooks" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${invite.code}/join`, { token: ze.accessToken });

const detail = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
const general = detail.channels.find((c) => c.type === "TEXT");
const room = detail.channels.find((c) => c.type === "VOICE");

console.log("\n== criar ==");
const hook = await api(`/guilds/${guild.id}/webhooks`, {
  token: owner.accessToken,
  body: { name: "CI do projeto", channelId: general.id },
});
if (!hook.url.includes(hook.id)) throw new Error("a URL nao contem o id");
ok(`webhook criado, com URL pronta pra copiar (${hook.url.split("/api")[1].slice(0, 24)}…)`);
if (!hook.bot?.id) throw new Error("webhook sem usuario-bot");
ok(`nasceu com um usuario-bot proprio (@${hook.bot.username})`);

await refusal(403, "quem nao tem MANAGE_WEBHOOKS nao lista", () =>
  api(`/guilds/${guild.id}/webhooks`, { token: ze.accessToken, method: "GET" }),
);

await refusal(400, "webhook nao aponta pra canal de voz", () =>
  api(`/guilds/${guild.id}/webhooks`, {
    token: owner.accessToken,
    body: { name: "Voz", channelId: room.id },
  }),
);

console.log("\n== postar sem login ==");
const socketZe = await connect(ze.accessToken);
await emit(socketZe, "channel:subscribe", { channelId: general.id });

const received = new Promise((resolve) => socketZe.once("message:created", resolve));

const post = (body) =>
  fetch(`${BASE}/api/webhooks/${hook.id}/${hook.url.split("/").pop()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const sending = await post({ content: "build 42 passou ✅" });
if (sending.status !== 201) throw new Error(`postar devolveu ${sending.status} ${await sending.text()}`);
ok("postou sem nenhum login, so com o token da URL");

const event = await Promise.race([received, new Promise((_, r) => setTimeout(() => r(new Error("nao chegou em tempo real")), 5000))]);
if (event.content !== "build 42 passou ✅") throw new Error("conteudo diferente");
if (event.author.id !== hook.bot.id) throw new Error("mensagem nao esta assinada pelo bot");
ok(`chegou em tempo real pra quem esta no canal, assinada por "${event.author.displayName}"`);

const withIdentity = await post({ content: "deploy em producao", username: "Deploy" });
if (withIdentity.status !== 201) throw new Error("postar com username falhou");
const past = await api(`/channels/${general.id}/messages`, { token: owner.accessToken, method: "GET" });
const last = past.messages.at(-1);
if (last.author.displayName !== "Deploy") throw new Error("username da mensagem nao foi aplicado");
ok("username por mensagem troca a identidade (formato do Discord)");

console.log("\n== recusas ==");
const tokenWrong = await fetch(`${BASE}/api/webhooks/${hook.id}/token-inventado-mas-do-tamanho-certo`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: "invasao" }),
});
if (tokenWrong.status !== 401) throw new Error(`token errado devolveu ${tokenWrong.status}`);
ok("token errado -> 401");

const empty = await post({ content: "   " });
if (empty.status !== 400) throw new Error(`mensagem vazia devolveu ${empty.status}`);
ok("mensagem vazia -> 400");

const gust = await Promise.all([1, 2, 3, 4, 5].map(() => post({ content: "spam" })));
if (!gust.some((r) => r.status === 429)) throw new Error("a vazao nao segurou a rajada");
ok("rajada de mensagens bate no limite de vazao -> 429");

console.log("\n== editar e apagar ==");
const moved = await api(`/guilds/${guild.id}/webhooks/${hook.id}`, {
  token: owner.accessToken,
  method: "PATCH",
  body: { name: "CI renomeado" },
});
if (moved.name !== "CI renomeado") throw new Error("nome nao mudou");
ok("renomear muda o webhook e o nome que assina as mensagens");

await api(`/guilds/${guild.id}/webhooks/${hook.id}`, { token: owner.accessToken, method: "DELETE" });
const after = await post({ content: "ainda funciona?" });
if (after.status !== 404) throw new Error(`URL de webhook apagado devolveu ${after.status}`);
ok("apagado, a URL para de funcionar (404) e o historico continua la");

const historyFinal = await api(`/channels/${general.id}/messages`, { token: owner.accessToken, method: "GET" });
if (historyFinal.messages.length < 2) throw new Error("as mensagens do webhook sumiram junto");
ok(`o historico manteve as ${historyFinal.messages.length} mensagens do bot`);

const ephemeral = await api(`/guilds/${guild.id}/webhooks`, {
  token: owner.accessToken,
  body: { name: "So pra testar", channelId: general.id },
});
await api(`/guilds/${guild.id}/webhooks/${ephemeral.id}`, { token: owner.accessToken, method: "DELETE" });

const search = await fetch(`${BASE}/api/users/${ephemeral.bot.id}`, {
  headers: { Authorization: `Bearer ${owner.accessToken}` },
});
if (search.status !== 404) throw new Error(`o usuario-bot sobrou (status ${search.status})`);
ok("webhook apagado sem ter postado nada nao deixa conta-fantasma");

socketZe.close();
await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
