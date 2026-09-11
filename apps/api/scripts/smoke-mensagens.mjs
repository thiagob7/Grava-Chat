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

const owner = await api("/auth/dev-login", { body: { email: "dono-msg@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-msg@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Mensagens" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${invite.code}/join`, { token: ze.accessToken });

const detail = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
const general = detail.channels.find((c) => c.type === "TEXT");
const room = detail.channels.find((c) => c.type === "VOICE");

const socketOwner = await connect(owner.accessToken);
const socketZe = await connect(ze.accessToken);
await emit(socketOwner, "channel:subscribe", { channelId: general.id });
await emit(socketZe, "channel:subscribe", { channelId: general.id });

console.log("\n== anexo com spoiler ==");
const sentWithSpoiler = await emit(socketOwner, "message:send", {
  channelId: general.id,
  content: "olha isso",
  nonce: "s1",
  attachments: [
    {
      id: "a1",
      url: "https://exemplo/imagem.png",
      filename: "final.png",
      contentType: "image/png",
      size: 1234,
      spoiler: true,
      description: "o final do filme",
    },
  ],
});
const past = await api(`/channels/${general.id}/messages`, { token: ze.accessToken, method: "GET" });
const withSpoiler = past.messages.find((m) => m.id === sentWithSpoiler.id);
const attachment = withSpoiler.attachments[0];
if (!attachment.spoiler) throw new Error("o spoiler nao chegou marcado");
if (attachment.description !== "o final do filme") throw new Error("a descricao do anexo sumiu");
ok("anexo chega marcado como spoiler e com texto alternativo");

console.log("\n== chat no canal de voz ==");
await emit(socketOwner, "message:send", { channelId: room.id, content: "chat da call", nonce: "v1" });
const inVoice = await api(`/channels/${room.id}/messages`, { token: ze.accessToken, method: "GET" });
if (inVoice.messages.at(-1).content !== "chat da call") throw new Error("mensagem no canal de voz falhou");
ok("canal de voz aceita mensagem (o chat que fica ao lado da chamada)");

console.log("\n== fixar ==");
await refusal(403, "membro comum nao fixa", () =>
  api(`/messages/${withSpoiler.id}/pin`, { token: ze.accessToken, method: "PUT" }),
);

const pinned = await api(`/messages/${withSpoiler.id}/pin`, { token: owner.accessToken, method: "PUT" });
if (!pinned.pinnedAt) throw new Error("a mensagem nao ficou fixada");

const pinned = await api(`/channels/${general.id}/pins`, { token: ze.accessToken, method: "GET" });
if (pinned.length !== 1) throw new Error(`esperava 1 fixada, veio ${pinned.length}`);
ok("quem modera fixa, e a fixada aparece no painel para todo mundo");

await api(`/messages/${withSpoiler.id}/pin`, { token: owner.accessToken, method: "DELETE" });
if ((await api(`/channels/${general.id}/pins`, { token: owner.accessToken, method: "GET" })).length !== 0) {
  throw new Error("desafixar nao tirou do painel");
}
ok("desafixar tira do painel");

console.log("\n== enquete ==");
const created = await emit(socketOwner, "message:send", {
  channelId: general.id,
  content: "",
  nonce: "p1",
  poll: { question: "pizza hoje?", options: [{ text: "sim" }, { text: "claro" }] },
});

const search = async (id) =>
  (await api(`/channels/${general.id}/messages`, { token: owner.accessToken, method: "GET" }))
    .messages.find((m) => m.id === id);

const poll = await search(created.id);
if (poll.poll?.options?.length !== 2) throw new Error("a enquete nao foi criada");
ok(`enquete criada com ${poll.poll.options.length} opcoes`);

const option = poll.poll.options[0].id;
const optionB = poll.poll.options[1].id;

await emit(socketZe, "poll:vote", { messageId: poll.id, optionId: option });
await emit(socketOwner, "poll:vote", { messageId: poll.id, optionId: option });

let current = (await api(`/channels/${general.id}/messages`, { token: owner.accessToken, method: "GET" }))
  .messages.find((m) => m.id === poll.id);
if (current.poll.options[0].userIds.length !== 2) throw new Error("os votos nao contaram");
ok("dois votos na mesma opcao contam os dois");

await emit(socketZe, "poll:vote", { messageId: poll.id, optionId: optionB });
current = (await api(`/channels/${general.id}/messages`, { token: owner.accessToken, method: "GET" }))
  .messages.find((m) => m.id === poll.id);
if (current.poll.options[0].userIds.length !== 1 || current.poll.options[1].userIds.length !== 1) {
  throw new Error("escolha unica nao moveu o voto");
}
ok("enquete de escolha unica move o voto em vez de somar");

await emit(socketZe, "poll:vote", { messageId: poll.id, optionId: optionB });
current = (await api(`/channels/${general.id}/messages`, { token: owner.accessToken, method: "GET" }))
  .messages.find((m) => m.id === poll.id);
if (current.poll.options[1].userIds.length !== 0) throw new Error("nao deu pra desmarcar o voto");
ok("clicar na opcao ja marcada tira o voto");

await emit(socketOwner, "poll:close", { messageId: poll.id });
try {
  await emit(socketZe, "poll:vote", { messageId: poll.id, optionId: option });
  throw new Error("FALHOU: votou numa enquete encerrada");
} catch (e) {
  if (!/encerrou/i.test(e.message)) throw e;
  ok("enquete encerrada nao aceita mais voto");
}

console.log("\n== modo lento ==");
await api(`/guilds/${guild.id}/channels/${general.id}`, {
  token: owner.accessToken,
  method: "PATCH",
  body: { slowmodeSeconds: 10 },
});

await emit(socketZe, "message:send", { channelId: general.id, content: "primeira", nonce: "l1" });
try {
  await emit(socketZe, "message:send", { channelId: general.id, content: "segunda", nonce: "l2" });
  throw new Error("FALHOU: o modo lento deixou passar a segunda");
} catch (e) {
  if (!/modo lento/i.test(e.message)) throw e;
  ok(`o modo lento segura a segunda mensagem ("${e.message}")`);
}

await emit(socketOwner, "message:send", { channelId: general.id, content: "eu passo", nonce: "l3" });
await emit(socketOwner, "message:send", { channelId: general.id, content: "duas vezes", nonce: "l4" });
ok("quem modera o canal passa direto pelo modo lento");

socketOwner.close();
socketZe.close();
await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
