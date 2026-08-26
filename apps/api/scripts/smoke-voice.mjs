import { io } from "socket.io-client";

const BASE = "http://localhost:3333";

async function limpar(guildIds, token) {
  for (const id of guildIds.filter(Boolean)) {
    await fetch(`${BASE}/api/guilds/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}
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

const connect = (token) =>
  new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ["websocket"] });
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });
const emit = (s, ev, p) =>
  new Promise((res, rej) => s.emit(ev, p, (r) => (r.ok ? res(r.data) : rej(new Error(r.error)))));
const waitFor = (s, ev, ms = 3000) =>
  new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`timeout esperando ${ev}`)), ms);
    s.once(ev, (p) => (clearTimeout(t), res(p)));
  });

const a = await api("/auth/dev-login", { body: { email: "voz-a@gravae.io", displayName: "Ana" } });
const b = await api("/auth/dev-login", { body: { email: "voz-b@gravae.io", displayName: "Bruno" } });
const c = await api("/auth/dev-login", { body: { email: "voz-c@gravae.io", displayName: "Intruso" } });

const guild = await api("/guilds", { token: a.accessToken, body: { name: "Teste Voz" } });
const inv = await api(`/guilds/${guild.id}/invites`, { token: a.accessToken });
await api(`/invites/${inv.code}/join`, { token: b.accessToken });

let detail = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
const voice = detail.channels.find((ch) => ch.type === "VOICE");
const text = detail.channels.find((ch) => ch.type === "TEXT");

console.log("\n== token do SFU ==");
const tok = await api(`/channels/${voice.id}/voice-token`, { token: a.accessToken });
if (!tok.token || !tok.url.startsWith("ws")) throw new Error("token/url invalidos");
const claims = JSON.parse(Buffer.from(tok.token.split(".")[1], "base64url").toString());
if (claims.video.room !== `channel-${voice.id}`) throw new Error("token emitido pra sala errada");
if (claims.sub !== JSON.parse(Buffer.from(a.accessToken.split(".")[1], "base64url").toString()).sub)
  throw new Error("identity do token nao e o usuario");
ok(`token emitido para a sala ${claims.video.room}, identity correta`);

try {
  await api(`/channels/${voice.id}/voice-token`, { token: c.accessToken });
  throw new Error("FALHOU: nao-membro recebeu token de voz");
} catch (e) {
  if (!/404|403/.test(e.message)) throw e;
  ok("nao-membro nao consegue token — nao entra na call");
}

try {
  await api(`/channels/${text.id}/voice-token`, { token: a.accessToken });
  throw new Error("FALHOU: emitiu token pra canal de texto");
} catch (e) {
  if (!/não é de voz/.test(e.message)) throw e;
  ok("canal de texto nao emite token de voz");
}

console.log("\n== entrar e sair ==");
const sa = await connect(a.accessToken);
const sb = await connect(b.accessToken);

const sawJoin = waitFor(sb, "voice:joined");
const state = await emit(sa, "voice:join", { channelId: voice.id });
const joined = await sawJoin;
if (joined.userId !== state.userId) throw new Error("evento de entrada com usuario errado");
ok(`Bruno viu Ana entrar em ${voice.name} (mute=${joined.selfMute}, cam=${joined.camera})`);

const sawUpdate = waitFor(sb, "voice:updated");
await emit(sa, "voice:state", { selfMute: true, camera: true });
const updated = await sawUpdate;
if (!updated.selfMute || !updated.camera) throw new Error("patch de estado nao propagou");
ok("mutar e ligar camera propagam pro servidor inteiro");

detail = await api(`/guilds/${guild.id}`, { token: b.accessToken, method: "GET" });
if (detail.voiceStates[voice.id]?.length !== 1) throw new Error("snapshot nao traz quem esta na call");
ok("quem abre o servidor ja ve quem esta no canal de voz");

console.log("\n== trocar de canal ==");
const other = await api(`/guilds/${guild.id}/channels`, {
  token: a.accessToken,
  body: { name: "Sala 2", type: "VOICE" },
});
const sawLeave = waitFor(sb, "voice:left");
await emit(sa, "voice:join", { channelId: other.id });
const left = await sawLeave;
if (left.channelId !== voice.id) throw new Error("saida do canal antigo nao foi anunciada");
ok("trocar de canal anuncia a saida do anterior — ninguem fica em dois lugares");

detail = await api(`/guilds/${guild.id}`, { token: b.accessToken, method: "GET" });
if (detail.voiceStates[voice.id]?.length !== 0) throw new Error("ficou fantasma no canal antigo");
ok("canal antigo ficou vazio de verdade");

console.log("\n== queda de conexao ==");
const sawDisconnectLeave = waitFor(sb, "voice:left", 14_000);
sa.close();
console.log("     esperando a janela de tolerancia...");
await sawDisconnectLeave;
detail = await api(`/guilds/${guild.id}`, { token: b.accessToken, method: "GET" });
if (detail.voiceStates[other.id]?.length !== 0) throw new Error("fantasma apos queda de conexao");
ok("passada a tolerancia, quem caiu sai do canal (sem fantasma)");

console.log("\n== varias abas ==");
const abaCall = await connect(b.accessToken);
const abaParada = await connect(b.accessToken);

const estadoCall = await emit(abaCall, "voice:join", { channelId: voice.id });
if (!estadoCall.socketId) throw new Error("estado de voz nao registra qual conexao esta na call");
ok(`a call ficou registrada na conexao ${estadoCall.socketId.slice(0, 6)}…`);

abaParada.close();
await new Promise((r) => setTimeout(r, 800));

detail = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
const aindaNaCall = detail.voiceStates[voice.id]?.some((v) => v.userId === estadoCall.userId);
if (!aindaNaCall) throw new Error("fechar uma aba parada tirou o usuario da chamada");
ok("fechar uma aba que NAO estava na call nao derruba a chamada");

abaCall.close();
console.log("     esperando a janela de tolerancia...");
await new Promise((r) => setTimeout(r, 8_000));

detail = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
if (detail.voiceStates[voice.id]?.length) throw new Error("fechar a aba da call nao limpou o estado");
ok("fechar a aba que ESTAVA na call encerra (apos a tolerancia)");

console.log("\n== reload ==");
const antes = await connect(b.accessToken);
await emit(antes, "voice:join", { channelId: voice.id });
antes.close();
await new Promise((r) => setTimeout(r, 1500));

detail = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
const orfao = detail.voiceStates[voice.id]?.[0];
if (!orfao) throw new Error("a chamada foi encerrada na hora — reload derruba da call");
if (!orfao.orphanedAt) throw new Error("o estado nao foi marcado como orfao");
ok("logo apos a queda, a chamada continua de pe (marcada como orfa)");

const depois = await connect(b.accessToken);
const reassumido = await emit(depois, "voice:join", { channelId: voice.id, resume: true });
if (reassumido.orphanedAt !== null) throw new Error("reassumir nao limpou o estado de orfao");
if (reassumido.socketId === orfao.socketId) throw new Error("nao trocou de conexao dona");
ok("a aba que voltou reassumiu a chamada, sem sair dela");

const intrusa = await connect(b.accessToken);
try {
  await emit(intrusa, "voice:join", { channelId: voice.id, resume: true });
  throw new Error("FALHOU: retomada roubou a chamada de uma aba ao vivo");
} catch (e) {
  if (!/Outra aba/.test(e.message)) throw e;
  ok("retomada e recusada quando outra aba esta ao vivo na chamada");
}
intrusa.close();

depois.close();
await new Promise((r) => setTimeout(r, 1500));
detail = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
if (!detail.voiceStates[voice.id]?.length) throw new Error("encerrou antes da janela de tolerancia");
ok("dentro da janela ainda aguarda (nao encerra no susto)");

console.log("     esperando a janela de tolerancia expirar...");
await new Promise((r) => setTimeout(r, 8_000));
detail = await api(`/guilds/${guild.id}`, { token: a.accessToken, method: "GET" });
if (detail.voiceStates[voice.id]?.length) throw new Error("ficou fantasma apos a janela");
ok("passada a janela sem ninguem reassumir, a chamada encerra de verdade");

console.log("\n== resistencia ==");
const burst = await Promise.all(Array.from({ length: 6 }, () => connect(b.accessToken)));
await new Promise((r) => setTimeout(r, 800));

const alive = await fetch(`${BASE}/api/health`).then((r) => r.json());
if (!alive.ok) throw new Error("a API caiu com conexoes simultaneas");
ok("6 conexoes simultaneas do mesmo usuario: API de pe");

burst.forEach((s) => s.close());
await new Promise((r) => setTimeout(r, 500));
const stillAlive = await fetch(`${BASE}/api/health`).then((r) => r.json());
if (!stillAlive.ok) throw new Error("a API caiu ao desconectar tudo de uma vez");
ok("6 desconexoes simultaneas: API de pe");

sb.close();
await limpar([guild.id], a.accessToken);
console.log("\nVoz ok.\n");
process.exit(0);
