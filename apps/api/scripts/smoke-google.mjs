const BASE = "http://localhost:3333";
const NGROK = "emmanuel-successful-intensely.ngrok-free.dev";
const ok = (m) => console.log(`  ok  ${m}`);

const config = await fetch(`${BASE}/api/auth/config`).then((r) => r.json());
if (!config.google) {
  console.log("  --  GOOGLE_CLIENT_ID/SECRET ausentes: pulando");
  process.exit(0);
}
ok("credenciais do Google configuradas");

const paramsDe = async (headers = {}) => {
  const res = await fetch(`${BASE}/api/auth/google`, { headers, redirect: "manual" });
  const loc = res.headers.get("location");
  if (!loc) throw new Error(`/auth/google nao redirecionou (${res.status})`);
  return { url: new URL(loc), cookies: res.headers.getSetCookie() };
};

console.log("\n== redirect direto (URI 1 do console) ==");
const direct = await paramsDe();
if (direct.url.origin !== "https://accounts.google.com") throw new Error("nao vai pro Google");
const redirectDirect = direct.url.searchParams.get("redirect_uri");
if (redirectDirect !== `${BASE}/api/auth/google/callback`) throw new Error(`redirect_uri errada: ${redirectDirect}`);
ok(`redirect_uri = ${redirectDirect}`);

const scope = direct.url.searchParams.get("scope");
if (!scope?.includes("email") || !scope.includes("openid")) throw new Error(`scope insuficiente: ${scope}`);
ok(`scope = ${scope}`);

if (!direct.url.searchParams.get("state")) throw new Error("sem state — vulneravel a CSRF");
if (!direct.cookies.some((c) => c.includes("HttpOnly"))) throw new Error("state nao foi guardado em cookie httpOnly");
ok("state presente e guardado em cookie httpOnly (protege contra CSRF)");

console.log("\n== redirect atras do tunel (URI 2 do console) ==");
const tunnel = await paramsDe({ "x-forwarded-host": NGROK, "x-forwarded-proto": "https" });
const redirectTunnel = tunnel.url.searchParams.get("redirect_uri");
if (redirectTunnel !== `https://${NGROK}/api/auth/google/callback`) throw new Error(`redirect_uri errada: ${redirectTunnel}`);
ok(`redirect_uri = ${redirectTunnel}`);

console.log("\n== callback protegido ==");
const withoutState = await fetch(`${BASE}/api/auth/google/callback?code=inventado`, { redirect: "manual" });
const destination = withoutState.headers.get("location") ?? "";
if (!destination.includes("erro=google")) throw new Error("callback sem state valido nao foi recusado");
ok("callback com state invalido e recusado (volta pro login com erro)");

console.log("\nGoogle ok.\n");
