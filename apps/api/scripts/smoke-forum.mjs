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

const dono = await api("/auth/dev-login", { body: { email: "dono-forum@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-forum@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Forum" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: ze.accessToken });

console.log("\n== criar canal de forum ==");
const forum = await api(`/guilds/${guild.id}/channels`, {
  token: dono.accessToken,
  body: { name: "duvidas", type: "FORUM" },
});
if (forum.type !== "FORUM") throw new Error("o canal nao virou forum");
ok("canal de forum criado");

console.log("\n== assuntos ==");
const socketZe = await connect(ze.accessToken);
await emit(socketZe, "channel:subscribe", { channelId: forum.id });

const primeiro = await api(`/channels/${forum.id}/posts`, {
  token: dono.accessToken,
  body: { title: "Como monta o PC?", content: "queria montar um pc pra jogar" },
});
if (primeiro.post.messageCount !== 1) throw new Error("o post nao contou a primeira mensagem");
ok(`assunto criado ("${primeiro.post.title}") com o corpo como primeira mensagem`);

const segundo = await api(`/channels/${forum.id}/posts`, {
  token: ze.accessToken,
  body: { title: "Qual teclado?", content: "mecanico ou membrana" },
});

const lista = await api(`/channels/${forum.id}/posts`, { token: ze.accessToken, method: "GET" });
if (lista.posts.length !== 2) throw new Error(`esperava 2 assuntos, veio ${lista.posts.length}`);
if (lista.posts[0].id !== segundo.post.id) throw new Error("a lista nao esta por atividade");
ok("a lista vem por atividade — o assunto mais recente no topo");

console.log("\n== conversa dentro do assunto ==");
await emit(socketZe, "message:send", {
  channelId: forum.id,
  postId: primeiro.post.id,
  content: "eu montei o meu mes passado",
  nonce: "f1",
});

const doPost = await api(
  `/channels/${forum.id}/messages?postId=${primeiro.post.id}`,
  { token: dono.accessToken, method: "GET" },
);
if (doPost.messages.length !== 2) throw new Error(`esperava 2 mensagens no assunto, veio ${doPost.messages.length}`);
ok("a resposta entra na conversa do assunto, junto com o corpo");

const canalSolto = await api(`/channels/${forum.id}/messages`, { token: dono.accessToken, method: "GET" });
if (canalSolto.messages.length !== 0) throw new Error("mensagem de assunto vazou pro canal");
ok("o canal em si nao mistura as mensagens dos assuntos");

const depois = await api(`/channels/${forum.id}/posts`, { token: ze.accessToken, method: "GET" });
const atualizado = depois.posts.find((p) => p.id === primeiro.post.id);
if (atualizado.messageCount !== 2) throw new Error("a contagem de respostas nao subiu");
if (depois.posts[0].id !== primeiro.post.id) throw new Error("responder nao subiu o assunto");
ok("responder conta a mensagem e sobe o assunto pro topo");

console.log("\n== fechar ==");
await api(`/posts/${primeiro.post.id}`, {
  token: dono.accessToken,
  method: "PATCH",
  body: { closed: true },
});

try {
  await emit(socketZe, "message:send", {
    channelId: forum.id,
    postId: primeiro.post.id,
    content: "ainda da?",
    nonce: "f2",
  });
  throw new Error("FALHOU: respondeu num assunto fechado");
} catch (e) {
  if (!/fechado/i.test(e.message)) throw e;
  ok("assunto fechado nao aceita resposta");
}

try {
  await emit(socketZe, "message:send", { channelId: forum.id, content: "solta", nonce: "f3" });
  throw new Error("FALHOU: escreveu solto no forum");
} catch (e) {
  if (!/assunto/i.test(e.message)) throw e;
  ok("no forum nao existe mensagem solta — tem que estar num assunto");
}

socketZe.close();
await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
