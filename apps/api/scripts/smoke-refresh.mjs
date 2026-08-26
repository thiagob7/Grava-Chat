const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

const login = await fetch(`${BASE}/api/auth/dev-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "refresh-race@gravae.io", displayName: "Corrida" }),
});
let cookie = login.headers.getSetCookie().find((c) => c.startsWith("gravae_rt=")).split(";")[0];
ok("logado, cookie de refresh recebido");

const refresh = () => fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { cookie } });

const [a, b] = await Promise.all([refresh(), refresh()]);
if (a.status !== 200 || b.status !== 200) throw new Error(`corrida derrubou a sessao: ${a.status}/${b.status}`);
ok("dois refresh simultaneos: ambos 200, sessao intacta");

const rotated = [a, b].map((r) => r.headers.getSetCookie().find((c) => c.startsWith("gravae_rt="))).filter(Boolean);
if (rotated.length !== 2) throw new Error(`toda resposta precisa sair com cookie usavel, veio ${rotated.length}`);
ok("as duas respostas saem com um cookie utilizavel");

for (const [i, set] of rotated.entries()) {
  const res = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { cookie: set.split(";")[0] } });
  if (res.status !== 200) throw new Error(`cookie ${i + 1} da corrida nao funciona (${res.status})`);
}
ok("os dois cookies da corrida continuam validos");

cookie = rotated[0].split(";")[0];

const perdido = cookie;
const respostaPerdida = await refresh();
if (respostaPerdida.status !== 200) throw new Error("refresh normal falhou");

const recuperacao = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { cookie: perdido } });
if (recuperacao.status !== 200) throw new Error("cookie antigo apos resposta perdida devolveu 401");

const novo = recuperacao.headers.getSetCookie().find((c) => c.startsWith("gravae_rt="));
if (!novo) throw new Error("a recuperacao nao devolveu cookie novo — a sessao ficaria presa no antigo");
ok("resposta de refresh perdida no meio do caminho: a sessao se recupera sozinha");

cookie = novo.split(";")[0];
if ((await refresh()).status !== 200) throw new Error("o cookie rotacionado nao funciona");
ok("o cookie novo continua valido");

const bad = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { cookie: "gravae_rt=inventado" } });
if (bad.status !== 401) throw new Error(`token invalido devolveu ${bad.status}`);
ok("token inventado continua sendo recusado com 401");

const fresh = await fetch(`${BASE}/api/auth/dev-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "refresh-race@gravae.io" }),
});
const freshCookie = fresh.headers.getSetCookie().find((c) => c.startsWith("gravae_rt=")).split(";")[0];
const { accessToken } = await fresh.json();

const out = await fetch(`${BASE}/api/auth/logout-all`, {
  method: "POST",
  headers: { authorization: `Bearer ${accessToken}` },
});
if (out.status !== 204) throw new Error(`logout-all devolveu ${out.status}`);

const afterLogout = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { cookie: freshCookie } });
if (afterLogout.status !== 401) throw new Error("logout-all nao revogou nada — a sessao continua viva");
ok("logout-all revoga de verdade todas as sessoes");

console.log("\nRefresh ok.\n");
