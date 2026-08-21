/**
 * Configuracoes do servidor: editar, convites e excluir — com as regras de
 * quem pode o que.
 */
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

const dono = await api("/auth/dev-login", { body: { email: "dono-cfg@gravae.io", displayName: "Dono" } });
const membro = await api("/auth/dev-login", { body: { email: "membro-cfg@gravae.io", displayName: "Membro" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Config" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: membro.accessToken });

console.log("\n== editar o servidor ==");
const editado = await api(`/guilds/${guild.id}`, {
  token: dono.accessToken,
  method: "PATCH",
  body: { name: "Teste Config Renomeado", description: "um servidor de teste", iconUrl: "https://exemplo/i.png" },
});
if (editado.name !== "Teste Config Renomeado") throw new Error("nome nao mudou");
if (editado.description !== "um servidor de teste") throw new Error("descricao nao salvou");
ok(`nome, descricao e icone salvos (${editado.memberCount} membros)`);

const detalhe = await api(`/guilds/${guild.id}`, { token: membro.accessToken, method: "GET" });
if (detalhe.guild.description !== "um servidor de teste") throw new Error("descricao nao veio no detalhe");
ok("a descricao chega para os membros no detalhe do servidor");

try {
  await api(`/guilds/${guild.id}`, { token: membro.accessToken, method: "PATCH", body: { name: "invadido" } });
  throw new Error("FALHOU: membro comum editou o servidor");
} catch (e) {
  if (!/403/.test(e.message)) throw e;
  ok("membro comum recebe 403 ao tentar editar");
}

console.log("\n== convites ==");
const convites = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, method: "GET" });
if (convites.length !== 1) throw new Error(`esperava 1 convite, veio ${convites.length}`);
if (convites[0].uses !== 1) throw new Error("uso do convite nao foi contado");
if (convites[0].expired) throw new Error("convite valido marcado como expirado");
ok(`convite listado com ${convites[0].uses} uso e quem criou (${convites[0].inviter.displayName})`);

await api(`/guilds/${guild.id}/invites/${convites[0].id}`, { token: dono.accessToken, method: "DELETE" });
if ((await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, method: "GET" })).length !== 0) {
  throw new Error("convite revogado ainda aparece");
}
ok("revogar convite tira ele da lista");

try {
  await api(`/invites/${convite.code}/join`, { token: dono.accessToken });
  throw new Error("FALHOU: convite revogado ainda funciona");
} catch (e) {
  if (!/404/.test(e.message)) throw e;
  ok("convite revogado nao serve mais para entrar");
}

console.log("\n== excluir ==");
try {
  await api(`/guilds/${guild.id}`, { token: membro.accessToken, method: "DELETE" });
  throw new Error("FALHOU: membro comum excluiu o servidor");
} catch (e) {
  if (!/403/.test(e.message)) throw e;
  ok("so o dono pode excluir");
}

await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
try {
  await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
  throw new Error("FALHOU: servidor excluido ainda responde");
} catch (e) {
  if (!/404/.test(e.message)) throw e;
  ok("servidor excluido some de verdade");
}

console.log("\nConfiguracoes do servidor ok.\n");
