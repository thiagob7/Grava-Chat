import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

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

const owner = await api("/auth/dev-login", { body: { email: "dono-perm@gravae.io", displayName: "Dono" } });
const mod = await api("/auth/dev-login", { body: { email: "mod-perm@gravae.io", displayName: "Moderador" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-perm@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Permissoes" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${invite.code}/join`, { token: mod.accessToken });
await api(`/invites/${invite.code}/join`, { token: ze.accessToken });

const detailOwner = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
const general = detailOwner.channels.find((c) => c.type === "TEXT");
const room = detailOwner.channels.find((c) => c.type === "VOICE");

console.log("\n== servidor novo ja nasce com @everyone ==");
const roleList = await api(`/guilds/${guild.id}/roles`, { token: owner.accessToken, method: "GET" });
const everyone = roleList.find((c) => c.isEveryone);
if (!everyone) throw new Error("servidor sem @everyone");
if (everyone.position !== 0) throw new Error("@everyone deveria estar na posicao 0");
if (!everyone.permissions.includes("SEND_MESSAGES")) throw new Error("@everyone sem SEND_MESSAGES");
ok(`@everyone criado com ${everyone.permissions.length} permissoes`);

if (!detailOwner.permissions.includes("ADMINISTRATOR")) throw new Error("dono sem ADMINISTRATOR");
ok("o dono recebe todas as permissoes no detalhe do servidor");

console.log("\n== criar cargo e atribuir ==");
const roleMod = await api(`/guilds/${guild.id}/roles`, {
  token: owner.accessToken,
  body: { name: "Moderador", color: "#3498db", permissions: ["MANAGE_ROLES", "MANAGE_MESSAGES", "KICK_MEMBERS"] },
});
if (roleMod.position !== 1) throw new Error(`cargo novo deveria nascer na posicao 1, veio ${roleMod.position}`);
ok(`cargo "${roleMod.name}" criado logo acima do @everyone`);

await api(`/guilds/${guild.id}/members/${mod.user.id}/roles`, {
  token: owner.accessToken,
  method: "PATCH",
  body: { roleIds: [roleMod.id] },
});
const detailMod = await api(`/guilds/${guild.id}`, { token: mod.accessToken, method: "GET" });
if (!detailMod.permissions.includes("MANAGE_MESSAGES")) throw new Error("cargo nao somou permissao");
if (detailMod.permissions.includes("MANAGE_GUILD")) throw new Error("ganhou permissao que o cargo nao da");
ok("quem recebe o cargo passa a ter exatamente o que ele da");

console.log("\n== hierarquia ==");
await refusal(403, "o moderador nao consegue conceder ADMINISTRATOR (nao tem)", () =>
  api(`/guilds/${guild.id}/roles/${roleMod.id}`, {
    token: mod.accessToken,
    method: "PATCH",
    body: { permissions: ["ADMINISTRATOR"] },
  }),
);

await refusal(403, "o moderador nao consegue editar o proprio cargo (nao esta abaixo dele)", () =>
  api(`/guilds/${guild.id}/roles/${roleMod.id}`, {
    token: mod.accessToken,
    method: "PATCH",
    body: { name: "Chefe" },
  }),
);

const roleDown = await api(`/guilds/${guild.id}/roles`, {
  token: owner.accessToken,
  body: { name: "Design", permissions: ["ATTACH_FILES"] },
});
await api(`/guilds/${guild.id}/roles/${roleDown.id}`, {
  token: mod.accessToken,
  method: "PATCH",
  body: { name: "Design Renomeado" },
});
ok("o moderador edita um cargo abaixo do dele");

await refusal(403, "o moderador nao consegue puxar um cargo para cima do seu", () =>
  api(`/guilds/${guild.id}/roles`, {
    token: mod.accessToken,
    method: "PATCH",
    body: { roles: [{ id: roleDown.id, position: 9 }] },
  }),
);

await refusal(403, "o Ze, sem MANAGE_ROLES, nao cria cargo", () =>
  api(`/guilds/${guild.id}/roles`, { token: ze.accessToken, body: { name: "Hacker" } }),
);

console.log("\n== overwrite de canal: o canal some de quem nao pode ver ==");
await api(`/guilds/${guild.id}/channels/${general.id}/permissions/${everyone.id}`, {
  token: owner.accessToken,
  method: "PUT",
  body: { type: "ROLE", allow: [], deny: ["VIEW_CHANNEL"] },
});

const zeAfter = await api(`/guilds/${guild.id}`, { token: ze.accessToken, method: "GET" });
if (zeAfter.channels.some((c) => c.id === general.id)) throw new Error("o canal negado ainda aparece");
ok("negar VIEW_CHANNEL ao @everyone tira o canal da lista do Ze");

const ownerAfter = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
if (!ownerAfter.channels.some((c) => c.id === general.id)) throw new Error("o dono perdeu o canal");
ok("o dono continua vendo o canal (ADMINISTRATOR ignora restricao de canal)");

await refusal(404, "o Ze nao consegue nem ler as mensagens do canal escondido", () =>
  api(`/channels/${general.id}/messages`, { token: ze.accessToken, method: "GET" }),
);

await api(`/guilds/${guild.id}/channels/${general.id}/permissions/${roleMod.id}`, {
  token: owner.accessToken,
  method: "PUT",
  body: { type: "ROLE", allow: ["VIEW_CHANNEL"], deny: [] },
});
const modAfter = await api(`/guilds/${guild.id}`, { token: mod.accessToken, method: "GET" });
if (!modAfter.channels.some((c) => c.id === general.id)) throw new Error("allow de cargo nao devolveu o canal");
ok("permitir no cargo devolve o canal para quem tem o cargo");

await api(`/guilds/${guild.id}/channels/${general.id}/permissions/${ze.user.id}`, {
  token: owner.accessToken,
  method: "PUT",
  body: { type: "MEMBER", allow: ["VIEW_CHANNEL"], deny: [] },
});
const zeWithException = await api(`/guilds/${guild.id}`, { token: ze.accessToken, method: "GET" });
if (!zeWithException.channels.some((c) => c.id === general.id)) throw new Error("overwrite de pessoa nao funcionou");
ok("excecao para uma pessoa vence o @everyone");

console.log("\n== enviar mensagem e voz respeitam o canal ==");
await api(`/guilds/${guild.id}/channels/${general.id}/permissions/${ze.user.id}`, {
  token: owner.accessToken,
  method: "PUT",
  body: { type: "MEMBER", allow: ["VIEW_CHANNEL"], deny: ["SEND_MESSAGES"] },
});
const socketZe = await connect(ze.accessToken);
try {
  await emit(socketZe, "message:send", { channelId: general.id, content: "oi", nonce: "smoke-1" });
  throw new Error("FALHOU: o Ze escreveu num canal onde SEND_MESSAGES esta negado");
} catch (e) {
  if (!/nao pode escrever|não pode escrever/i.test(e.message)) throw e;
  ok(`o Ze ve o canal mas nao escreve nele ("${e.message}")`);
}
socketZe.close();

await api(`/guilds/${guild.id}/channels/${room.id}/permissions/${everyone.id}`, {
  token: owner.accessToken,
  method: "PUT",
  body: { type: "ROLE", allow: [], deny: ["CONNECT"] },
});
await refusal(403, "sem CONNECT, o token de voz e recusado", () =>
  api(`/channels/${room.id}/voice-token`, { token: ze.accessToken }),
);

console.log("\n== apagar cargo ==");
await api(`/guilds/${guild.id}/roles/${roleMod.id}`, { token: owner.accessToken, method: "DELETE" });
const modWithoutRole = await api(`/guilds/${guild.id}`, { token: mod.accessToken, method: "GET" });
const eu = modWithoutRole.members.find((m) => m.user.id === mod.user.id);
if (eu.roleIds.includes(roleMod.id)) throw new Error("o cargo apagado continua no membro");
if (modWithoutRole.permissions.includes("MANAGE_MESSAGES")) throw new Error("permissao sobreviveu ao cargo apagado");
ok("apagar o cargo tira ele das pessoas e as permissoes vao junto");

await refusal(400, "o @everyone nao pode ser apagado", () =>
  api(`/guilds/${guild.id}/roles/${everyone.id}`, { token: owner.accessToken, method: "DELETE" }),
);

await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
