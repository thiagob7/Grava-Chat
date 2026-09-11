const BASE = "http://localhost:3333";
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

const owner = await api("/auth/dev-login", { body: { email: "dono-cfg@gravae.io", displayName: "Dono" } });
const member = await api("/auth/dev-login", { body: { email: "membro-cfg@gravae.io", displayName: "Membro" } });

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Config" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${invite.code}/join`, { token: member.accessToken });

console.log("\n== editar o servidor ==");
const edited = await api(`/guilds/${guild.id}`, {
  token: owner.accessToken,
  method: "PATCH",
  body: { name: "Teste Config Renomeado", description: "um servidor de teste", iconUrl: "https://exemplo/i.png" },
});
if (edited.name !== "Teste Config Renomeado") throw new Error("nome nao mudou");
if (edited.description !== "um servidor de teste") throw new Error("descricao nao salvou");
ok(`nome, descricao e icone salvos (${edited.memberCount} membros)`);

const detail = await api(`/guilds/${guild.id}`, { token: member.accessToken, method: "GET" });
if (detail.guild.description !== "um servidor de teste") throw new Error("descricao nao veio no detalhe");
ok("a descricao chega para os membros no detalhe do servidor");

try {
  await api(`/guilds/${guild.id}`, { token: member.accessToken, method: "PATCH", body: { name: "invadido" } });
  throw new Error("FALHOU: membro comum editou o servidor");
} catch (e) {
  if (!/403/.test(e.message)) throw e;
  ok("membro comum recebe 403 ao tentar editar");
}

console.log("\n== convites ==");
const invites = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, method: "GET" });
if (invites.length !== 1) throw new Error(`esperava 1 convite, veio ${invites.length}`);
if (invites[0].uses !== 1) throw new Error("uso do convite nao foi contado");
if (invites[0].expired) throw new Error("convite valido marcado como expirado");
ok(`convite listado com ${invites[0].uses} uso e quem criou (${invites[0].inviter.displayName})`);

await api(`/guilds/${guild.id}/invites/${invites[0].id}`, { token: owner.accessToken, method: "DELETE" });
if ((await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, method: "GET" })).length !== 0) {
  throw new Error("convite revogado ainda aparece");
}
ok("revogar convite tira ele da lista");

try {
  await api(`/invites/${invite.code}/join`, { token: owner.accessToken });
  throw new Error("FALHOU: convite revogado ainda funciona");
} catch (e) {
  if (!/404/.test(e.message)) throw e;
  ok("convite revogado nao serve mais para entrar");
}

console.log("\n== excluir ==");
try {
  await api(`/guilds/${guild.id}`, { token: member.accessToken, method: "DELETE" });
  throw new Error("FALHOU: membro comum excluiu o servidor");
} catch (e) {
  if (!/403/.test(e.message)) throw e;
  ok("so o dono pode excluir");
}

await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
try {
  await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
  throw new Error("FALHOU: servidor excluido ainda responde");
} catch (e) {
  if (!/404/.test(e.message)) throw e;
  ok("servidor excluido some de verdade");
}

console.log("\nConfiguracoes do servidor ok.\n");
