import { createHash, randomBytes } from "node:crypto";
import Redis from "ioredis";

const BASE = "http://localhost:3333";
const REDIS = process.env.REDIS_URL ?? "redis://localhost:6381";
const ok = (m) => console.log(`  ok  ${m}`);

const hash = (value) => createHash("sha256").update(value).digest("base64url");
const b64 = () => randomBytes(32).toString("base64url");

const config = await fetch(`${BASE}/api/auth/config`).then((r) => r.json());
if (!config.google) {
  console.log("  --  GOOGLE_CLIENT_ID/SECRET ausentes: pulando");
  process.exit(0);
}

console.log("\n== o app abre o navegador ==");

const verifier = b64();
const start = await fetch(
  `${BASE}/api/auth/desktop/start?desafio=${encodeURIComponent(hash(verifier))}`,
  { redirect: "manual" },
);

if (start.status !== 302) throw new Error(`/auth/desktop/start devolveu ${start.status}`);
if (start.headers.get("location") !== "/api/auth/google") {
  throw new Error(`start nao caiu no fluxo do Google: ${start.headers.get("location")}`);
}
ok("start manda pro consentimento do Google");

const cookieChallenge = start.headers.getSetCookie().find((c) => c.startsWith("gravae_desktop="));
if (!cookieChallenge) throw new Error("o desafio nao foi guardado em cookie");
if (!cookieChallenge.includes("HttpOnly")) throw new Error("o cookie do desafio precisa ser httpOnly");
ok("o desafio viaja em cookie httpOnly ate o callback");

const withoutChallenge = await fetch(`${BASE}/api/auth/desktop/start`, { redirect: "manual" });
if (withoutChallenge.status !== 400) throw new Error(`start sem desafio devolveu ${withoutChallenge.status}`);
ok("start sem desafio e recusado com 400");

console.log("\n== o navegador devolve o codigo ==");

const login = await fetch(`${BASE}/api/auth/dev-login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "desktop-login@gravae.io", displayName: "Teste Desktop" }),
});
const { user } = await login.json();

const redis = new Redis(REDIS, { maxRetriesPerRequest: 2 });

const seed = async (challenge) => {
  const code = b64();
  await redis.set(
    `desktop-login:${code}`,
    JSON.stringify({ userId: user.id, challenge }),
    "EX",
    120,
  );
  return code;
};

const swap = (code, check) =>
  fetch(`${BASE}/api/auth/desktop/trocar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, verifier: check }),
  });

const intercepted = await seed(hash(verifier));
const theft = await swap(intercepted, b64());
if (theft.status !== 401) throw new Error(`codigo com verificador errado devolveu ${theft.status}`);
ok("codigo interceptado, sem o verificador, nao vira sessao (401)");

const leftover = await redis.get(`desktop-login:${intercepted}`);
if (leftover) throw new Error("o codigo continua valido depois de uma tentativa errada");
ok("a tentativa errada ja queima o codigo");

const code = await seed(hash(verifier));
const swap = await swap(code, verifier);
if (swap.status !== 200) throw new Error(`troca legitima devolveu ${swap.status}`);

const session = await swap.json();
if (session.user?.id !== user.id) throw new Error("a sessao saiu para o usuario errado");
if (!swap.headers.getSetCookie().some((c) => c.startsWith("gravae_rt="))) {
  throw new Error("a troca nao gravou o cookie de refresh");
}
ok("troca legitima devolve sessao e cookie httpOnly");

const me = await fetch(`${BASE}/api/me`, {
  headers: { authorization: `Bearer ${session.accessToken}` },
});
if (me.status !== 200) throw new Error(`o access token da troca nao funciona (${me.status})`);
ok("o access token da troca abre /api/me");

const repeated = await swap(code, verifier);
if (repeated.status !== 401) throw new Error(`codigo reusado devolveu ${repeated.status}`);
ok("o mesmo codigo nao serve duas vezes (401)");

const invented = await swap(b64(), verifier);
if (invented.status !== 401) throw new Error(`codigo inventado devolveu ${invented.status}`);
ok("codigo inventado e recusado com 401");

await redis.quit();
console.log("\nLogin do aplicativo ok.\n");
