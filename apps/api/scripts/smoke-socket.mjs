/**
 * Teste de fumaca do tempo real: dois usuarios no mesmo canal, um manda e o
 * outro tem que receber. Uso: node apps/api/scripts/smoke-socket.mjs
 */
import { io } from "socket.io-client";

const BASE = "http://localhost:3333";

/**
 * Limpa o que este teste criou. Sem isso, cada execução deixa um servidor e
 * usuários no banco — em uma tarde de desenvolvimento vira dezenas de
 * servidores fantasma na barra lateral de quem está usando o app.
 */
async function limpar(guildIds, token) {
  for (const id of guildIds.filter(Boolean)) {
    await fetch(`${BASE}/api/guilds/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}
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

const ok = (m) => console.log(`  ok  ${m}`);
const connect = (token) =>
  new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ["websocket"] });
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });
const emit = (s, ev, payload) =>
  new Promise((resolve, reject) =>
    s.emit(ev, payload, (r) => (r.ok ? resolve(r.data) : reject(new Error(`${ev}: ${r.error}`)))),
  );
const waitFor = (s, ev, ms = 3000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout esperando ${ev}`)), ms);
    s.once(ev, (p) => (clearTimeout(t), resolve(p)));
  });

// --- preparo: dois usuarios no mesmo servidor -------------------------------
const a = await api("/auth/dev-login", { body: { email: "socket-a@gravae.io", displayName: "Ana" } });
const b = await api("/auth/dev-login", { body: { email: "socket-b@gravae.io", displayName: "Bruno" } });
const guild = await api("/guilds", { token: a.accessToken, body: { name: "Teste Socket" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: a.accessToken });
await api(`/invites/${invite.code}/join`, { token: b.accessToken });
const detail = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
const channel = detail.channels.find((c) => c.type === "TEXT");

console.log("\n== conexao ==");
const sa = await connect(a.accessToken);
const sb = await connect(b.accessToken);
ok("dois sockets autenticados por JWT");

try {
  await connect("token-falso");
  throw new Error("FALHOU: token invalido foi aceito");
} catch (e) {
  if (!/inválido|invalid/i.test(e.message)) throw e;
  ok("token invalido e recusado no handshake");
}

console.log("\n== mensagens ==");
await Promise.all([emit(sa, "channel:subscribe", { channelId: channel.id }), emit(sb, "channel:subscribe", { channelId: channel.id })]);
ok("ambos inscritos no canal");

const received = waitFor(sb, "message:created");
await emit(sa, "message:send", { channelId: channel.id, content: "fala rapaziada", nonce: "n1" });
const msg = await received;
if (msg.content !== "fala rapaziada") throw new Error("conteudo errado");
ok(`Bruno recebeu "${msg.content}" de ${msg.author.displayName}`);

const echo = waitFor(sa, "message:created");
await emit(sb, "message:send", { channelId: channel.id, content: "salve", nonce: "n2" });
ok(`Ana recebeu a resposta "${(await echo).content}"`);

console.log("\n== reacoes ==");
const brunoId = JSON.parse(Buffer.from(b.accessToken.split(".")[1], "base64url").toString()).sub;
const anaId = JSON.parse(Buffer.from(a.accessToken.split(".")[1], "base64url").toString()).sub;

const reacted = waitFor(sb, "message:reactions");
await emit(sb, "message:react", { messageId: msg.id, emoji: "🔥" });
const r = await reacted;
if (!r.reactions[0].userIds.includes(brunoId)) throw new Error("quem reagiu nao esta na lista");
ok("evento traz quem reagiu (o cliente resolve o proprio 'me')");

/**
 * Espera o evento com DOIS ids em vez do proximo evento qualquer: o broadcast
 * vai pra sala inteira, entao os dois sockets recebem os dois eventos e o
 * "proximo evento" nao e necessariamente o que interessa.
 */
const bothReacted = new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error("timeout esperando 2 reacoes")), 3000);
  sa.on("message:reactions", (p) => {
    if (p.reactions[0]?.userIds.length === 2) { clearTimeout(t); res(p); }
  });
});
await emit(sa, "message:react", { messageId: msg.id, emoji: "🔥" });
const ra = await bothReacted;
if (!ra.reactions[0].userIds.includes(anaId)) throw new Error("segundo reagente ausente");
ok(`contador agrupou: ${ra.reactions[0].emoji} x${ra.reactions[0].userIds.length}`);

console.log("\n== editar e apagar ==");
const edited = waitFor(sb, "message:updated");
await emit(sa, "message:edit", { messageId: msg.id, content: "fala rapaziada (editado)" });
if (!(await edited).editedAt) throw new Error("editedAt nao veio");
ok("edicao propagou com editedAt");

try {
  await emit(sb, "message:edit", { messageId: msg.id, content: "hackeado" });
  throw new Error("FALHOU: editou mensagem alheia");
} catch (e) {
  if (!/suas mensagens/.test(e.message)) throw e;
  ok("nao da pra editar mensagem dos outros");
}

const deleted = waitFor(sb, "message:deleted");
await emit(sa, "message:delete", { messageId: msg.id });
await deleted;
ok("exclusao propagou");

console.log("\n== digitando e presenca ==");
const typing = waitFor(sb, "typing:started");
await emit(sa, "typing:start", { channelId: channel.id });
ok(`"${(await typing).user.displayName} está digitando"`);

const presence = waitFor(sb, "presence:changed");
await emit(sa, "presence:update", { status: "DND" });
const p = await presence;
if (p.status !== "DND") throw new Error("status errado");
ok(`presenca propagou para os membros do servidor: ${p.status}`);

console.log("\n== presenca com duas conexoes ==");
/**
 * Regressao: o StrictMode do React monta o efeito duas vezes, entao o mesmo
 * usuario abre dois sockets. O broadcast de presenca so acontece na transicao
 * 0->1 sessoes, entao o segundo socket nunca receberia o evento e o usuario
 * aparecia OFFLINE pra si mesmo. O snapshot precisa vir do Redis.
 */
const sa2 = await connect(a.accessToken);
const snapshot = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
const ana = snapshot.members.find((m) => m.user.id === snapshot.members[0].user.id && m.user.displayName === "Ana");
if (ana.user.status === "OFFLINE") throw new Error("usuario com socket aberto aparece OFFLINE no snapshot");
ok(`com 2 conexoes abertas, o snapshot diz ${ana.user.status}`);
sa2.close();

console.log("\n== persistencia ==");
/**
 * Regressao: `deletedAt: null` no Prisma+Mongo nao casa com campo ausente, e o
 * historico voltava VAZIO mesmo com mensagens no banco. O tempo real continuava
 * funcionando, entao so aparecia depois de um F5 — bug silencioso.
 */
await emit(sa, "message:send", { channelId: channel.id, content: "isso tem que sobreviver ao F5" });
const hist = await api(`/channels/${channel.id}/messages`, { token: a.accessToken, method: "GET" });
const found = hist.messages.filter((m) => m.content === "isso tem que sobreviver ao F5");
if (found.length !== 1) throw new Error(`historico devolveu ${hist.messages.length} mensagens; a nova nao esta la`);
ok(`historico REST devolve as mensagens enviadas (${hist.messages.length} no canal)`);

const deletable = found[0];
await emit(sa, "message:delete", { messageId: deletable.id });
const after = await api(`/channels/${channel.id}/messages`, { token: a.accessToken, method: "GET" });
if (after.messages.some((m) => m.id === deletable.id)) throw new Error("mensagem apagada ainda aparece");
ok("mensagem apagada some do historico");

console.log("\n== validacao ==");
try {
  await emit(sa, "message:send", { channelId: "nao-e-um-id", content: "x" });
  throw new Error("FALHOU: aceitou id invalido");
} catch (e) {
  if (!/id invalido/.test(e.message)) throw e;
  ok("payload invalido e recusado pelo schema compartilhado");
}

/**
 * Canal de voz agora ACEITA mensagem: e o chat que fica ao lado da chamada.
 * A checagem antiga ("nao da pra escrever") passava por acidente — a mensagem
 * de FALHOU tambem casava com o regex. Aqui o teste confere o texto que voltou.
 */
const voiceChannel = detail.channels.find((c) => c.type === "VOICE");
const naVoz = await emit(sa, "message:send", { channelId: voiceChannel.id, content: "chat da call", nonce: "v1" });
if (!naVoz?.id) throw new Error("canal de voz recusou a mensagem do chat");
ok("canal de voz aceita mensagem (o chat da chamada)");

sa.close();
sb.close();
await limpar([guild.id], a.accessToken);
console.log("\nTempo real ok.\n");
process.exit(0);
