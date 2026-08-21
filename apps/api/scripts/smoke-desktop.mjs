/**
 * Fumaça do login do aplicativo de desktop.
 *
 * O consentimento do Google exige um humano na tela — o que dá pra verificar
 * sozinho é a parte que o app inventou: o desafio guardado no cookie, e o
 * código de uso único que só vira sessão na mão de quem tem o verificador.
 *
 * O código é semeado direto no Redis porque, no fluxo real, quem o emite é o
 * callback do Google. É o mesmo dado, no mesmo formato.
 */
import { createHash, randomBytes } from "node:crypto";
import Redis from "ioredis";

const BASE = "http://localhost:3333";
const REDIS = process.env.REDIS_URL ?? "redis://localhost:6381";
const ok = (m) => console.log(`  ok  ${m}`);

const hash = (valor) => createHash("sha256").update(valor).digest("base64url");
const b64 = () => randomBytes(32).toString("base64url");

const config = await fetch(`${BASE}/api/auth/config`).then((r) => r.json());
if (!config.google) {
  console.log("  --  GOOGLE_CLIENT_ID/SECRET ausentes: pulando");
  process.exit(0);
}

console.log("\n== o app abre o navegador ==");

const verificador = b64();
const start = await fetch(
  `${BASE}/api/auth/desktop/start?desafio=${encodeURIComponent(hash(verificador))}`,
  { redirect: "manual" },
);

if (start.status !== 302) throw new Error(`/auth/desktop/start devolveu ${start.status}`);
if (start.headers.get("location") !== "/api/auth/google") {
  throw new Error(`start nao caiu no fluxo do Google: ${start.headers.get("location")}`);
}
ok("start manda pro consentimento do Google");

const cookieDesafio = start.headers.getSetCookie().find((c) => c.startsWith("gravae_desktop="));
if (!cookieDesafio) throw new Error("o desafio nao foi guardado em cookie");
if (!cookieDesafio.includes("HttpOnly")) throw new Error("o cookie do desafio precisa ser httpOnly");
ok("o desafio viaja em cookie httpOnly ate o callback");

const semDesafio = await fetch(`${BASE}/api/auth/desktop/start`, { redirect: "manual" });
if (semDesafio.status !== 400) throw new Error(`start sem desafio devolveu ${semDesafio.status}`);
ok("start sem desafio e recusado com 400");

console.log("\n== o navegador devolve o codigo ==");

const login = await fetch(`${BASE}/api/auth/dev-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "desktop-login@gravae.io", displayName: "Teste Desktop" }),
});
const { user } = await login.json();

const redis = new Redis(REDIS, { maxRetriesPerRequest: 2 });

/** Mesmo formato que o callback do Google grava. */
const semear = async (desafio) => {
  const codigo = b64();
  await redis.set(
    `desktop-login:${codigo}`,
    JSON.stringify({ userId: user.id, desafio }),
    "EX",
    120,
  );
  return codigo;
};

const trocar = (codigo, verif) =>
  fetch(`${BASE}/api/auth/desktop/trocar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, verificador: verif }),
  });

const interceptado = await semear(hash(verificador));
const roubo = await trocar(interceptado, b64());
if (roubo.status !== 401) throw new Error(`codigo com verificador errado devolveu ${roubo.status}`);
ok("codigo interceptado, sem o verificador, nao vira sessao (401)");

const sobrou = await redis.get(`desktop-login:${interceptado}`);
if (sobrou) throw new Error("o codigo continua valido depois de uma tentativa errada");
ok("a tentativa errada ja queima o codigo");

const codigo = await semear(hash(verificador));
const troca = await trocar(codigo, verificador);
if (troca.status !== 200) throw new Error(`troca legitima devolveu ${troca.status}`);

const sessao = await troca.json();
if (sessao.user?.id !== user.id) throw new Error("a sessao saiu para o usuario errado");
if (!troca.headers.getSetCookie().some((c) => c.startsWith("gravae_rt="))) {
  throw new Error("a troca nao gravou o cookie de refresh");
}
ok("troca legitima devolve sessao e cookie httpOnly");

const me = await fetch(`${BASE}/api/me`, {
  headers: { authorization: `Bearer ${sessao.accessToken}` },
});
if (me.status !== 200) throw new Error(`o access token da troca nao funciona (${me.status})`);
ok("o access token da troca abre /api/me");

const repetido = await trocar(codigo, verificador);
if (repetido.status !== 401) throw new Error(`codigo reusado devolveu ${repetido.status}`);
ok("o mesmo codigo nao serve duas vezes (401)");

const inventado = await trocar(b64(), verificador);
if (inventado.status !== 401) throw new Error(`codigo inventado devolveu ${inventado.status}`);
ok("codigo inventado e recusado com 401");

await redis.quit();
console.log("\nLogin do aplicativo ok.\n");
