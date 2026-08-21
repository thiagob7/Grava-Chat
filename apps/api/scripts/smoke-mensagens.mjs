/**
 * Compositor e mensagens: fixar, spoiler, enquete e modo lento.
 */
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

const dono = await api("/auth/dev-login", { body: { email: "dono-msg@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-msg@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Mensagens" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: ze.accessToken });

const detalhe = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
const geral = detalhe.channels.find((c) => c.type === "TEXT");
const sala = detalhe.channels.find((c) => c.type === "VOICE");

const socketDono = await connect(dono.accessToken);
const socketZe = await connect(ze.accessToken);
await emit(socketDono, "channel:subscribe", { channelId: geral.id });
await emit(socketZe, "channel:subscribe", { channelId: geral.id });

console.log("\n== anexo com spoiler ==");
const enviadaComSpoiler = await emit(socketDono, "message:send", {
  channelId: geral.id,
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
const historico = await api(`/channels/${geral.id}/messages`, { token: ze.accessToken, method: "GET" });
const comSpoiler = historico.messages.find((m) => m.id === enviadaComSpoiler.id);
const anexo = comSpoiler.attachments[0];
if (!anexo.spoiler) throw new Error("o spoiler nao chegou marcado");
if (anexo.description !== "o final do filme") throw new Error("a descricao do anexo sumiu");
ok("anexo chega marcado como spoiler e com texto alternativo");

console.log("\n== chat no canal de voz ==");
await emit(socketDono, "message:send", { channelId: sala.id, content: "chat da call", nonce: "v1" });
const naVoz = await api(`/channels/${sala.id}/messages`, { token: ze.accessToken, method: "GET" });
if (naVoz.messages.at(-1).content !== "chat da call") throw new Error("mensagem no canal de voz falhou");
ok("canal de voz aceita mensagem (o chat que fica ao lado da chamada)");

console.log("\n== fixar ==");
await recusa(403, "membro comum nao fixa", () =>
  api(`/messages/${comSpoiler.id}/pin`, { token: ze.accessToken, method: "PUT" }),
);

const fixada = await api(`/messages/${comSpoiler.id}/pin`, { token: dono.accessToken, method: "PUT" });
if (!fixada.pinnedAt) throw new Error("a mensagem nao ficou fixada");

const fixadas = await api(`/channels/${geral.id}/pins`, { token: ze.accessToken, method: "GET" });
if (fixadas.length !== 1) throw new Error(`esperava 1 fixada, veio ${fixadas.length}`);
ok("quem modera fixa, e a fixada aparece no painel para todo mundo");

await api(`/messages/${comSpoiler.id}/pin`, { token: dono.accessToken, method: "DELETE" });
if ((await api(`/channels/${geral.id}/pins`, { token: dono.accessToken, method: "GET" })).length !== 0) {
  throw new Error("desafixar nao tirou do painel");
}
ok("desafixar tira do painel");

console.log("\n== enquete ==");
// o ack do socket devolve so o id; a mensagem inteira vem pelo evento/historico
const criada = await emit(socketDono, "message:send", {
  channelId: geral.id,
  content: "",
  nonce: "p1",
  poll: { pergunta: "pizza hoje?", opcoes: [{ texto: "sim" }, { texto: "claro" }] },
});

const buscar = async (id) =>
  (await api(`/channels/${geral.id}/messages`, { token: dono.accessToken, method: "GET" }))
    .messages.find((m) => m.id === id);

const enquete = await buscar(criada.id);
if (enquete.poll?.opcoes?.length !== 2) throw new Error("a enquete nao foi criada");
ok(`enquete criada com ${enquete.poll.opcoes.length} opcoes`);

const opcaoA = enquete.poll.opcoes[0].id;
const opcaoB = enquete.poll.opcoes[1].id;

await emit(socketZe, "poll:vote", { messageId: enquete.id, optionId: opcaoA });
await emit(socketDono, "poll:vote", { messageId: enquete.id, optionId: opcaoA });

let atual = (await api(`/channels/${geral.id}/messages`, { token: dono.accessToken, method: "GET" }))
  .messages.find((m) => m.id === enquete.id);
if (atual.poll.opcoes[0].userIds.length !== 2) throw new Error("os votos nao contaram");
ok("dois votos na mesma opcao contam os dois");

// escolha unica: votar na outra opcao move o voto
await emit(socketZe, "poll:vote", { messageId: enquete.id, optionId: opcaoB });
atual = (await api(`/channels/${geral.id}/messages`, { token: dono.accessToken, method: "GET" }))
  .messages.find((m) => m.id === enquete.id);
if (atual.poll.opcoes[0].userIds.length !== 1 || atual.poll.opcoes[1].userIds.length !== 1) {
  throw new Error("escolha unica nao moveu o voto");
}
ok("enquete de escolha unica move o voto em vez de somar");

// clicar de novo na mesma opcao tira o voto
await emit(socketZe, "poll:vote", { messageId: enquete.id, optionId: opcaoB });
atual = (await api(`/channels/${geral.id}/messages`, { token: dono.accessToken, method: "GET" }))
  .messages.find((m) => m.id === enquete.id);
if (atual.poll.opcoes[1].userIds.length !== 0) throw new Error("nao deu pra desmarcar o voto");
ok("clicar na opcao ja marcada tira o voto");

await emit(socketDono, "poll:close", { messageId: enquete.id });
try {
  await emit(socketZe, "poll:vote", { messageId: enquete.id, optionId: opcaoA });
  throw new Error("FALHOU: votou numa enquete encerrada");
} catch (e) {
  if (!/encerrou/i.test(e.message)) throw e;
  ok("enquete encerrada nao aceita mais voto");
}

console.log("\n== modo lento ==");
await api(`/guilds/${guild.id}/channels/${geral.id}`, {
  token: dono.accessToken,
  method: "PATCH",
  body: { slowmodeSeconds: 10 },
});

await emit(socketZe, "message:send", { channelId: geral.id, content: "primeira", nonce: "l1" });
try {
  await emit(socketZe, "message:send", { channelId: geral.id, content: "segunda", nonce: "l2" });
  throw new Error("FALHOU: o modo lento deixou passar a segunda");
} catch (e) {
  if (!/modo lento/i.test(e.message)) throw e;
  ok(`o modo lento segura a segunda mensagem ("${e.message}")`);
}

await emit(socketDono, "message:send", { channelId: geral.id, content: "eu passo", nonce: "l3" });
await emit(socketDono, "message:send", { channelId: geral.id, content: "duas vezes", nonce: "l4" });
ok("quem modera o canal passa direto pelo modo lento");

socketDono.close();
socketZe.close();
await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
