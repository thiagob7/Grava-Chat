/**
 * Cargos, permissoes e overwrites de canal ponta a ponta. O calculo em si tem
 * testes de unidade (packages/shared/src/permissions.test.ts); aqui o que se
 * verifica e o que a API faz com ele: hierarquia, canal invisivel, e as rotas
 * recusando de verdade.
 */
import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

/** Mensagem so sai por socket — a rota REST de envio nao existe de proposito. */
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

const recusa = async (esperado, descricao, fn) => {
  try {
    await fn();
    throw new Error(`FALHOU: ${descricao}`);
  } catch (e) {
    if (!new RegExp(`-> ${esperado}`).test(e.message)) throw e;
    ok(`${descricao} -> ${esperado}`);
  }
};

const dono = await api("/auth/dev-login", { body: { email: "dono-perm@gravae.io", displayName: "Dono" } });
const mod = await api("/auth/dev-login", { body: { email: "mod-perm@gravae.io", displayName: "Moderador" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-perm@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Permissoes" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: mod.accessToken });
await api(`/invites/${convite.code}/join`, { token: ze.accessToken });

const detalheDono = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
const geral = detalheDono.channels.find((c) => c.type === "TEXT");
const sala = detalheDono.channels.find((c) => c.type === "VOICE");

console.log("\n== servidor novo ja nasce com @everyone ==");
const cargos = await api(`/guilds/${guild.id}/roles`, { token: dono.accessToken, method: "GET" });
const everyone = cargos.find((c) => c.isEveryone);
if (!everyone) throw new Error("servidor sem @everyone");
if (everyone.position !== 0) throw new Error("@everyone deveria estar na posicao 0");
if (!everyone.permissions.includes("SEND_MESSAGES")) throw new Error("@everyone sem SEND_MESSAGES");
ok(`@everyone criado com ${everyone.permissions.length} permissoes`);

if (!detalheDono.permissions.includes("ADMINISTRATOR")) throw new Error("dono sem ADMINISTRATOR");
ok("o dono recebe todas as permissoes no detalhe do servidor");

console.log("\n== criar cargo e atribuir ==");
const cargoMod = await api(`/guilds/${guild.id}/roles`, {
  token: dono.accessToken,
  body: { name: "Moderador", color: "#3498db", permissions: ["MANAGE_ROLES", "MANAGE_MESSAGES", "KICK_MEMBERS"] },
});
if (cargoMod.position !== 1) throw new Error(`cargo novo deveria nascer na posicao 1, veio ${cargoMod.position}`);
ok(`cargo "${cargoMod.name}" criado logo acima do @everyone`);

await api(`/guilds/${guild.id}/members/${mod.user.id}/roles`, {
  token: dono.accessToken,
  method: "PATCH",
  body: { roleIds: [cargoMod.id] },
});
const detalheMod = await api(`/guilds/${guild.id}`, { token: mod.accessToken, method: "GET" });
if (!detalheMod.permissions.includes("MANAGE_MESSAGES")) throw new Error("cargo nao somou permissao");
if (detalheMod.permissions.includes("MANAGE_GUILD")) throw new Error("ganhou permissao que o cargo nao da");
ok("quem recebe o cargo passa a ter exatamente o que ele da");

console.log("\n== hierarquia ==");
await recusa(403, "o moderador nao consegue conceder ADMINISTRATOR (nao tem)", () =>
  api(`/guilds/${guild.id}/roles/${cargoMod.id}`, {
    token: mod.accessToken,
    method: "PATCH",
    body: { permissions: ["ADMINISTRATOR"] },
  }),
);

await recusa(403, "o moderador nao consegue editar o proprio cargo (nao esta abaixo dele)", () =>
  api(`/guilds/${guild.id}/roles/${cargoMod.id}`, {
    token: mod.accessToken,
    method: "PATCH",
    body: { name: "Chefe" },
  }),
);

const cargoBaixo = await api(`/guilds/${guild.id}/roles`, {
  token: dono.accessToken,
  body: { name: "Design", permissions: ["ATTACH_FILES"] },
});
// o novo entrou na posicao 1 e empurrou o Moderador para 2
await api(`/guilds/${guild.id}/roles/${cargoBaixo.id}`, {
  token: mod.accessToken,
  method: "PATCH",
  body: { name: "Design Renomeado" },
});
ok("o moderador edita um cargo abaixo do dele");

await recusa(403, "o moderador nao consegue puxar um cargo para cima do seu", () =>
  api(`/guilds/${guild.id}/roles`, {
    token: mod.accessToken,
    method: "PATCH",
    body: { roles: [{ id: cargoBaixo.id, position: 9 }] },
  }),
);

await recusa(403, "o Ze, sem MANAGE_ROLES, nao cria cargo", () =>
  api(`/guilds/${guild.id}/roles`, { token: ze.accessToken, body: { name: "Hacker" } }),
);

console.log("\n== overwrite de canal: o canal some de quem nao pode ver ==");
await api(`/guilds/${guild.id}/channels/${geral.id}/permissions/${everyone.id}`, {
  token: dono.accessToken,
  method: "PUT",
  body: { type: "ROLE", allow: [], deny: ["VIEW_CHANNEL"] },
});

const zeDepois = await api(`/guilds/${guild.id}`, { token: ze.accessToken, method: "GET" });
if (zeDepois.channels.some((c) => c.id === geral.id)) throw new Error("o canal negado ainda aparece");
ok("negar VIEW_CHANNEL ao @everyone tira o canal da lista do Ze");

const donoDepois = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
if (!donoDepois.channels.some((c) => c.id === geral.id)) throw new Error("o dono perdeu o canal");
ok("o dono continua vendo o canal (ADMINISTRATOR ignora restricao de canal)");

await recusa(404, "o Ze nao consegue nem ler as mensagens do canal escondido", () =>
  api(`/channels/${geral.id}/messages`, { token: ze.accessToken, method: "GET" }),
);

await api(`/guilds/${guild.id}/channels/${geral.id}/permissions/${cargoMod.id}`, {
  token: dono.accessToken,
  method: "PUT",
  body: { type: "ROLE", allow: ["VIEW_CHANNEL"], deny: [] },
});
const modDepois = await api(`/guilds/${guild.id}`, { token: mod.accessToken, method: "GET" });
if (!modDepois.channels.some((c) => c.id === geral.id)) throw new Error("allow de cargo nao devolveu o canal");
ok("permitir no cargo devolve o canal para quem tem o cargo");

await api(`/guilds/${guild.id}/channels/${geral.id}/permissions/${ze.user.id}`, {
  token: dono.accessToken,
  method: "PUT",
  body: { type: "MEMBER", allow: ["VIEW_CHANNEL"], deny: [] },
});
const zeComExcecao = await api(`/guilds/${guild.id}`, { token: ze.accessToken, method: "GET" });
if (!zeComExcecao.channels.some((c) => c.id === geral.id)) throw new Error("overwrite de pessoa nao funcionou");
ok("excecao para uma pessoa vence o @everyone");

console.log("\n== enviar mensagem e voz respeitam o canal ==");
await api(`/guilds/${guild.id}/channels/${geral.id}/permissions/${ze.user.id}`, {
  token: dono.accessToken,
  method: "PUT",
  body: { type: "MEMBER", allow: ["VIEW_CHANNEL"], deny: ["SEND_MESSAGES"] },
});
const socketZe = await connect(ze.accessToken);
try {
  await emit(socketZe, "message:send", { channelId: geral.id, content: "oi", nonce: "smoke-1" });
  throw new Error("FALHOU: o Ze escreveu num canal onde SEND_MESSAGES esta negado");
} catch (e) {
  if (!/nao pode escrever|não pode escrever/i.test(e.message)) throw e;
  ok(`o Ze ve o canal mas nao escreve nele ("${e.message}")`);
}
socketZe.close();

await api(`/guilds/${guild.id}/channels/${sala.id}/permissions/${everyone.id}`, {
  token: dono.accessToken,
  method: "PUT",
  body: { type: "ROLE", allow: [], deny: ["CONNECT"] },
});
await recusa(403, "sem CONNECT, o token de voz e recusado", () =>
  api(`/channels/${sala.id}/voice-token`, { token: ze.accessToken }),
);

console.log("\n== apagar cargo ==");
await api(`/guilds/${guild.id}/roles/${cargoMod.id}`, { token: dono.accessToken, method: "DELETE" });
const modSemCargo = await api(`/guilds/${guild.id}`, { token: mod.accessToken, method: "GET" });
const eu = modSemCargo.members.find((m) => m.user.id === mod.user.id);
if (eu.roleIds.includes(cargoMod.id)) throw new Error("o cargo apagado continua no membro");
if (modSemCargo.permissions.includes("MANAGE_MESSAGES")) throw new Error("permissao sobreviveu ao cargo apagado");
ok("apagar o cargo tira ele das pessoas e as permissoes vao junto");

await recusa(400, "o @everyone nao pode ser apagado", () =>
  api(`/guilds/${guild.id}/roles/${everyone.id}`, { token: dono.accessToken, method: "DELETE" }),
);

await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
