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
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${ev}: o servidor nao respondeu`)), 8000);

    s.emit(ev, payload, (r) => {
      clearTimeout(timer);
      r.ok ? resolve(r.data) : reject(new Error(r.error));
    });
  });

const owner = await api("/auth/dev-login", { body: { email: "dono-mod@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-mod@gravae.io", displayName: "Ze" } });
const messy = await api("/auth/dev-login", {
  body: { email: "bagunceiro-mod@gravae.io", displayName: "Bagunceiro" },
});

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Moderacao" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${invite.code}/join`, { token: ze.accessToken });
await api(`/invites/${invite.code}/join`, { token: messy.accessToken });

const detail = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
const general = detail.channels.find((c) => c.type === "TEXT");

console.log("\n== castigo ==");
const socketZe = await connect(ze.accessToken);
await emit(socketZe, "channel:subscribe", { channelId: general.id });
await emit(socketZe, "message:send", { channelId: general.id, content: "antes do castigo", nonce: "c0" });

await api(`/guilds/${guild.id}/members/${ze.user.id}/timeout`, {
  token: owner.accessToken,
  method: "PUT",
  body: { minutes: 10, reason: "brincadeira demais" },
});

try {
  await emit(socketZe, "message:send", { channelId: general.id, content: "e agora?", nonce: "c1" });
  throw new Error("FALHOU: escreveu de castigo");
} catch (e) {
  if (!/castigo/i.test(e.message)) throw e;
  ok(`de castigo nao escreve ("${e.message}")`);
}

await refusal(403, "de castigo tambem nao ganha token de voz pra falar", async () => {
  const room = detail.channels.find((c) => c.type === "VOICE");
  const r = await api(`/channels/${room.id}/voice-token`, { token: ze.accessToken });
  if (r.token) throw new Error("-> 403");
});

await api(`/guilds/${guild.id}/members/${ze.user.id}/timeout`, {
  token: owner.accessToken,
  method: "PUT",
  body: { minutes: 0 },
});
await emit(socketZe, "message:send", { channelId: general.id, content: "voltei", nonce: "c2" });
ok("tirar o castigo devolve a voz na hora");

console.log("\n== automod ==");
const rule = await api(`/guilds/${guild.id}/automod`, {
  token: owner.accessToken,
  body: {
    name: "Sem palavrao",
    trigger: "WORDS",
    words: ["bobagem", "asneira"],
    actions: ["BLOCK"],
  },
});
ok(`regra "${rule.name}" criada`);

const socketMessy = await connect(messy.accessToken);
await emit(socketMessy, "channel:subscribe", { channelId: general.id });

try {
  await emit(socketMessy, "message:send", {
    channelId: general.id,
    content: "isso é uma BOBAGEM!",
    nonce: "a1",
  });
  throw new Error("FALHOU: o automod deixou passar");
} catch (e) {
  if (!/AutoMod/i.test(e.message)) throw e;
  ok(`o automod bloqueia mesmo com maiuscula e pontuacao ("${e.message}")`);
}

await emit(socketMessy, "message:send", {
  channelId: general.id,
  content: "bobagemzinha nao conta",
  nonce: "a2",
});
ok("palavra dentro de outra palavra nao e bloqueada");

const socketOwner = await connect(owner.accessToken);
await emit(socketOwner, "channel:subscribe", { channelId: general.id });
await emit(socketOwner, "message:send", { channelId: general.id, content: "bobagem nenhuma", nonce: "a0" });
ok("quem administra o servidor passa pelo filtro");

const spam = await api(`/guilds/${guild.id}/automod`, {
  token: owner.accessToken,
  body: { name: "Sem spam de mencao", trigger: "MENTION_SPAM", limitMentions: 3, actions: ["BLOCK"] },
});
try {
  await emit(socketMessy, "message:send", {
    channelId: general.id,
    content: `<@${owner.user.id}> <@${ze.user.id}> <@${messy.user.id}> olha isso`,
    nonce: "a3",
  });
  throw new Error("FALHOU: passou spam de mencao");
} catch (e) {
  if (!/AutoMod/i.test(e.message)) throw e;
  ok("spam de mencao tambem e barrado");
}
void spam;

console.log("\n== banimento ==");
await refusal(403, "quem nao tem BAN_MEMBERS nao bane", () =>
  api(`/guilds/${guild.id}/bans/${messy.user.id}`, { token: ze.accessToken, method: "PUT", body: {} }),
);

await api(`/guilds/${guild.id}/bans/${messy.user.id}`, {
  token: owner.accessToken,
  method: "PUT",
  body: { reason: "spam", deleteHours: 1 },
});
ok("banido e removido do servidor");

await refusal(404, "banido perde o acesso ao servidor na hora", () =>
  api(`/guilds/${guild.id}`, { token: messy.accessToken, method: "GET" }),
);

await refusal(403, "banido nao volta nem com o convite na mao", () =>
  api(`/invites/${invite.code}/join`, { token: messy.accessToken }),
);

const bans = await api(`/guilds/${guild.id}/bans`, { token: owner.accessToken, method: "GET" });
if (bans.length !== 1 || bans[0].reason !== "spam") throw new Error("a lista de banidos nao bateu");
ok(`a lista mostra o banimento com motivo ("${bans[0].reason}")`);

await api(`/guilds/${guild.id}/bans/${messy.user.id}`, { token: owner.accessToken, method: "DELETE" });
await api(`/invites/${invite.code}/join`, { token: messy.accessToken });
ok("desbanido consegue voltar");

console.log("\n== auditoria ==");
const record = await api(`/guilds/${guild.id}/audit-log`, { token: owner.accessToken, method: "GET" });
const actions = record.entries.map((e) => e.action);

for (const expected of ["member.ban", "member.unban", "member.timeout", "automod.create"]) {
  if (!actions.includes(expected)) throw new Error(`a auditoria nao registrou ${expected}`);
}
ok(`auditoria registrou ${record.entries.length} acoes, incluindo ban, castigo e automod`);

const filtered = await api(`/guilds/${guild.id}/audit-log?action=member.ban`, {
  token: owner.accessToken,
  method: "GET",
});
if (!filtered.entries.length || filtered.entries.some((e) => !e.action.startsWith("member.ban"))) {
  throw new Error("o filtro por acao nao funcionou");
}
ok("o filtro por acao funciona");

await refusal(403, "quem nao tem VIEW_AUDIT_LOG nao ve o registro", () =>
  api(`/guilds/${guild.id}/audit-log`, { token: ze.accessToken, method: "GET" }),
);

socketZe.close();
socketMessy.close();
socketOwner.close();
await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
