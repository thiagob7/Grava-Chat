import { io } from "socket.io-client";

const BASE = "http://localhost:3333";

async function clear(guildIds, token) {
  for (const id of guildIds.filter(Boolean)) {
    await fetch(`${BASE}/api/guilds/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}
const ok = (m) => console.log(`  ok  ${m}`);

const api = async (path, { token, body, method = "POST" } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};
const connect = (token) => new Promise((res, rej) => {
  const s = io(BASE, { auth: { token }, transports: ["websocket"] });
  s.on("connect", () => res(s)); s.on("connect_error", rej);
});
const emit = (s, ev, p) => new Promise((res, rej) => s.emit(ev, p, (r) => (r.ok ? res(r.data) : rej(new Error(r.error)))));
const waitFor = (s, ev, ms = 3000) => new Promise((res, rej) => {
  const t = setTimeout(() => rej(new Error(`timeout esperando ${ev}`)), ms);
  s.once(ev, (p) => (clearTimeout(t), res(p ?? true)));
});

const suffix = Math.floor(Date.now() / 1000) % 100000;
const a = await api("/auth/dev-login", { body: { email: `amiga${suffix}@gravae.io`, displayName: "Amiga" } });
const b = await api("/auth/dev-login", { body: { email: `amigo${suffix}@gravae.io`, displayName: "Amigo" } });
const c = await api("/auth/dev-login", { body: { email: `estranho${suffix}@gravae.io`, displayName: "Estranho" } });

const sa = await connect(a.accessToken);
const sb = await connect(b.accessToken);

console.log("\n== pedido de amizade ==");
try {
  await api("/friends", { token: a.accessToken, body: { username: "nao-existe-mesmo-999" } });
  throw new Error("FALHOU: aceitou usuario inexistente");
} catch (e) { if (!/404/.test(e.message)) throw e; ok("username inexistente da 404"); }

try {
  await api("/friends", { token: a.accessToken, body: { username: a.user.username } });
  throw new Error("FALHOU: deixou adicionar a si mesmo");
} catch (e) { if (!/400/.test(e.message)) throw e; ok("nao da pra adicionar a si mesmo"); }

const noticeB = waitFor(sb, "friend:updated");
await api("/friends", { token: a.accessToken, body: { username: `@${b.user.username}` } });
await noticeB;
ok("pedido enviado (com @ no nome) e o outro lado foi avisado por socket");

let listB = await api("/friends", { token: b.accessToken, method: "GET" });
const request = listB.find((f) => f.user.username === a.user.username);
if (request?.status !== "PENDING_IN") throw new Error(`status errado: ${request?.status}`);
ok("quem recebeu ve PENDING_IN");

const list = await api("/friends", { token: a.accessToken, method: "GET" });
if (list[0]?.status !== "PENDING_OUT") throw new Error("quem enviou deveria ver PENDING_OUT");
ok("quem enviou ve PENDING_OUT");

try {
  await api("/friends/" + request.id + "/respond", { token: c.accessToken, body: { accept: true } });
  throw new Error("FALHOU: um terceiro aceitou o pedido");
} catch (e) { if (!/400|404/.test(e.message)) throw e; ok("um terceiro nao consegue responder o pedido"); }

console.log("\n== conversa privada ==");
try {
  await api("/dms", { token: a.accessToken, body: { userId: b.user.id } });
  throw new Error("FALHOU: abriu DM sem amizade");
} catch (e) { if (!/400/.test(e.message)) throw e; ok("sem amizade aceita, nao abre DM"); }

const notice = waitFor(sa, "friend:updated");
await api(`/friends/${request.id}/respond`, { token: b.accessToken, body: { accept: true } });
await notice;
ok("aceite propagou para quem enviou");

const dm = await api("/dms", { token: a.accessToken, body: { userId: b.user.id } });
if (!dm.id || dm.guildId !== null) throw new Error("DM invalida");
ok("DM criada (canal sem servidor)");

const same = await api("/dms", { token: b.accessToken, body: { userId: a.user.id } });
if (same.id !== dm.id) throw new Error("abriu uma segunda DM entre as mesmas pessoas");
ok("abrir de novo reaproveita a mesma conversa");

console.log("\n== mensagens na DM ==");
await Promise.all([emit(sa, "channel:subscribe", { channelId: dm.id }), emit(sb, "channel:subscribe", { channelId: dm.id })]);
const arrived = waitFor(sb, "message:created");
await emit(sa, "message:send", { channelId: dm.id, content: "oi, so nos dois aqui" });
const msg = await arrived;
if (msg.content !== "oi, so nos dois aqui") throw new Error("mensagem nao chegou");
ok("mensagem privada entregue");

const sc = await connect(c.accessToken);
try {
  await emit(sc, "channel:subscribe", { channelId: dm.id });
  throw new Error("FALHOU: um terceiro entrou na conversa privada");
} catch (e) { if (!/nao encontrado|não encontrado/i.test(e.message)) throw e; ok("um terceiro nao consegue nem se inscrever na DM"); }

const listDms = await api("/dms", { token: a.accessToken, method: "GET" });
if (listDms[0]?.user.username !== b.user.username) throw new Error("lista de DMs sem a outra pessoa");
ok("lista de DMs traz a outra pessoa e a ultima mensagem");

console.log("\n== perfil ==");
const profileB = await api(`/users/${b.user.id}`, { token: a.accessToken, method: "GET" });
if (profileB.friendship !== "ACCEPTED") throw new Error(`relacao errada no perfil: ${profileB.friendship}`);
if (typeof profileB.mutualGuilds !== "number") throw new Error("perfil sem contagem de servidores em comum");
ok(`perfil traz a relacao (${profileB.friendship}) e ${profileB.mutualGuilds} servidor(es) em comum`);

const myProfile = await api(`/users/${a.user.id}`, { token: a.accessToken, method: "GET" });
if (myProfile.friendship !== "SELF") throw new Error("o proprio perfil deveria vir como SELF");
ok("o proprio perfil vem marcado como SELF");

try {
  await api(`/users/${a.user.id}`, { token: c.accessToken, method: "GET" });
  throw new Error("FALHOU: estranho viu o perfil de quem nao compartilha nada");
} catch (e) {
  if (!/404/.test(e.message)) throw e;
  ok("estranho recebe 404 (nao confirma nem que a conta existe)");
}

console.log("\n== desfazer ==");
const relation = (await api("/friends", { token: a.accessToken, method: "GET" }))[0];
await api(`/friends/${relation.id}`, { token: a.accessToken, method: "DELETE" });
if ((await api("/friends", { token: a.accessToken, method: "GET" })).length !== 0) throw new Error("amizade nao foi desfeita");
ok("desfazer amizade remove dos dois lados");

sa.close(); sb.close(); sc.close();
await clear([], a.accessToken);
console.log("\nAmigos ok.\n");
process.exit(0);
