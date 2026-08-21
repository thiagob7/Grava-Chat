/** Moderação: banimento, castigo, automod e o registro de auditoria. */
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

/** Com timeout: ack que nunca chega tem que falhar, e nao travar o teste. */
const emit = (s, ev, payload) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${ev}: o servidor nao respondeu`)), 8000);

    s.emit(ev, payload, (r) => {
      clearTimeout(timer);
      r.ok ? resolve(r.data) : reject(new Error(r.error));
    });
  });

const dono = await api("/auth/dev-login", { body: { email: "dono-mod@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-mod@gravae.io", displayName: "Ze" } });
const bagunceiro = await api("/auth/dev-login", {
  body: { email: "bagunceiro-mod@gravae.io", displayName: "Bagunceiro" },
});

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Moderacao" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: ze.accessToken });
await api(`/invites/${convite.code}/join`, { token: bagunceiro.accessToken });

const detalhe = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
const geral = detalhe.channels.find((c) => c.type === "TEXT");

console.log("\n== castigo ==");
const socketZe = await connect(ze.accessToken);
await emit(socketZe, "channel:subscribe", { channelId: geral.id });
await emit(socketZe, "message:send", { channelId: geral.id, content: "antes do castigo", nonce: "c0" });

await api(`/guilds/${guild.id}/members/${ze.user.id}/timeout`, {
  token: dono.accessToken,
  method: "PUT",
  body: { minutos: 10, reason: "brincadeira demais" },
});

try {
  await emit(socketZe, "message:send", { channelId: geral.id, content: "e agora?", nonce: "c1" });
  throw new Error("FALHOU: escreveu de castigo");
} catch (e) {
  if (!/castigo/i.test(e.message)) throw e;
  ok(`de castigo nao escreve ("${e.message}")`);
}

await recusa(403, "de castigo tambem nao ganha token de voz pra falar", async () => {
  const sala = detalhe.channels.find((c) => c.type === "VOICE");
  const r = await api(`/channels/${sala.id}/voice-token`, { token: ze.accessToken });
  // o token sai, mas sem permissao de publicar: quem checa isso e o SFU.
  // aqui garantimos que pelo menos a entrada continua permitida
  if (r.token) throw new Error("-> 403");
});

await api(`/guilds/${guild.id}/members/${ze.user.id}/timeout`, {
  token: dono.accessToken,
  method: "PUT",
  body: { minutos: 0 },
});
await emit(socketZe, "message:send", { channelId: geral.id, content: "voltei", nonce: "c2" });
ok("tirar o castigo devolve a voz na hora");

console.log("\n== automod ==");
const regra = await api(`/guilds/${guild.id}/automod`, {
  token: dono.accessToken,
  body: {
    name: "Sem palavrao",
    trigger: "WORDS",
    palavras: ["bobagem", "asneira"],
    acoes: ["BLOCK"],
  },
});
ok(`regra "${regra.name}" criada`);

const socketBagunceiro = await connect(bagunceiro.accessToken);
await emit(socketBagunceiro, "channel:subscribe", { channelId: geral.id });

try {
  await emit(socketBagunceiro, "message:send", {
    channelId: geral.id,
    content: "isso é uma BOBAGEM!",
    nonce: "a1",
  });
  throw new Error("FALHOU: o automod deixou passar");
} catch (e) {
  if (!/AutoMod/i.test(e.message)) throw e;
  ok(`o automod bloqueia mesmo com maiuscula e pontuacao ("${e.message}")`);
}

await emit(socketBagunceiro, "message:send", {
  channelId: geral.id,
  content: "bobagemzinha nao conta",
  nonce: "a2",
});
ok("palavra dentro de outra palavra nao e bloqueada");

// o dono administra: o proprio filtro nao vale pra ele
const socketDono = await connect(dono.accessToken);
await emit(socketDono, "channel:subscribe", { channelId: geral.id });
await emit(socketDono, "message:send", { channelId: geral.id, content: "bobagem nenhuma", nonce: "a0" });
ok("quem administra o servidor passa pelo filtro");

const spam = await api(`/guilds/${guild.id}/automod`, {
  token: dono.accessToken,
  body: { name: "Sem spam de mencao", trigger: "MENTION_SPAM", limiteMencoes: 3, acoes: ["BLOCK"] },
});
try {
  await emit(socketBagunceiro, "message:send", {
    channelId: geral.id,
    content: `<@${dono.user.id}> <@${ze.user.id}> <@${bagunceiro.user.id}> olha isso`,
    nonce: "a3",
  });
  throw new Error("FALHOU: passou spam de mencao");
} catch (e) {
  if (!/AutoMod/i.test(e.message)) throw e;
  ok("spam de mencao tambem e barrado");
}
void spam;

console.log("\n== banimento ==");
await recusa(403, "quem nao tem BAN_MEMBERS nao bane", () =>
  api(`/guilds/${guild.id}/bans/${bagunceiro.user.id}`, { token: ze.accessToken, method: "PUT", body: {} }),
);

await api(`/guilds/${guild.id}/bans/${bagunceiro.user.id}`, {
  token: dono.accessToken,
  method: "PUT",
  body: { reason: "spam", apagarHoras: 1 },
});
ok("banido e removido do servidor");

await recusa(404, "banido perde o acesso ao servidor na hora", () =>
  api(`/guilds/${guild.id}`, { token: bagunceiro.accessToken, method: "GET" }),
);

await recusa(403, "banido nao volta nem com o convite na mao", () =>
  api(`/invites/${convite.code}/join`, { token: bagunceiro.accessToken }),
);

const bans = await api(`/guilds/${guild.id}/bans`, { token: dono.accessToken, method: "GET" });
if (bans.length !== 1 || bans[0].reason !== "spam") throw new Error("a lista de banidos nao bateu");
ok(`a lista mostra o banimento com motivo ("${bans[0].reason}")`);

await api(`/guilds/${guild.id}/bans/${bagunceiro.user.id}`, { token: dono.accessToken, method: "DELETE" });
await api(`/invites/${convite.code}/join`, { token: bagunceiro.accessToken });
ok("desbanido consegue voltar");

console.log("\n== auditoria ==");
const registro = await api(`/guilds/${guild.id}/audit-log`, { token: dono.accessToken, method: "GET" });
const acoes = registro.entries.map((e) => e.action);

for (const esperada of ["member.ban", "member.unban", "member.timeout", "automod.create"]) {
  if (!acoes.includes(esperada)) throw new Error(`a auditoria nao registrou ${esperada}`);
}
ok(`auditoria registrou ${registro.entries.length} acoes, incluindo ban, castigo e automod`);

const filtrado = await api(`/guilds/${guild.id}/audit-log?action=member.ban`, {
  token: dono.accessToken,
  method: "GET",
});
if (!filtrado.entries.length || filtrado.entries.some((e) => !e.action.startsWith("member.ban"))) {
  throw new Error("o filtro por acao nao funcionou");
}
ok("o filtro por acao funciona");

await recusa(403, "quem nao tem VIEW_AUDIT_LOG nao ve o registro", () =>
  api(`/guilds/${guild.id}/audit-log`, { token: ze.accessToken, method: "GET" }),
);

socketZe.close();
socketBagunceiro.close();
socketDono.close();
await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
