/**
 * Regressao da corrida de refresh: o StrictMode do React (e duas abas abrindo
 * juntas) mandam DOIS refresh com o mesmo cookie ao mesmo tempo. Antes da
 * janela de tolerancia, o segundo derrubava a sessao.
 */
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

// as duas chamadas saem juntas, com o MESMO cookie
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

/**
 * O caso que derrubava a sessao de verdade: um reload aborta a resposta do
 * refresh, o navegador NAO guarda o cookie novo e continua com o antigo. O
 * proximo pedido tem que reancorar a cadeia, e nao devolver 401.
 */
const perdido = cookie;
const respostaPerdida = await refresh(); // o "navegador" ignora este Set-Cookie
if (respostaPerdida.status !== 200) throw new Error("refresh normal falhou");

const recuperacao = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { cookie: perdido } });
if (recuperacao.status !== 200) throw new Error("cookie antigo apos resposta perdida devolveu 401");

const novo = recuperacao.headers.getSetCookie().find((c) => c.startsWith("gravae_rt="));
if (!novo) throw new Error("a recuperacao nao devolveu cookie novo — a sessao ficaria presa no antigo");
ok("resposta de refresh perdida no meio do caminho: a sessao se recupera sozinha");

cookie = novo.split(";")[0];
if ((await refresh()).status !== 200) throw new Error("o cookie rotacionado nao funciona");
ok("o cookie novo continua valido");

// e um token realmente invalido continua sendo recusado
const bad = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { cookie: "gravae_rt=inventado" } });
if (bad.status !== 401) throw new Error(`token invalido devolveu ${bad.status}`);
ok("token inventado continua sendo recusado com 401");

// logout-all tambem depende do filtro de "campo ausente vs null"
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
