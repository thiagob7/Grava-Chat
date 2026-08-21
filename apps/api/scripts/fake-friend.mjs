/**
 * Simula um amigo: entra pelo convite, conversa e reage.
 * Uso: node apps/api/scripts/fake-friend.mjs <codigo-do-convite>
 */
import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const code = process.argv[2];
if (!code) throw new Error("passe o codigo do convite");

const call = async (path, { token, body, method = "POST" } = {}) => {
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

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const { accessToken } = await call("/auth/dev-login", {
  body: { email: "leo@gravae.io", displayName: "Leonardo" },
});
const { guildId } = await call(`/invites/${code}/join`, { token: accessToken });
console.log("Leonardo entrou no servidor", guildId);

const detail = await call(`/guilds/${guildId}`, { token: accessToken, method: "GET" });
const channel = detail.channels.find((c) => c.type === "TEXT");

const socket = io(BASE, { auth: { token: accessToken }, transports: ["websocket"] });
await new Promise((r) => socket.on("connect", r));

const emit = (ev, p) =>
  new Promise((res, rej) => socket.emit(ev, p, (r) => (r.ok ? res(r.data) : rej(new Error(r.error)))));

await emit("channel:subscribe", { channelId: channel.id });

// As salas do Socket.IO vivem no servidor e somem quando o socket cai. Sem
// reinscrever no reconnect, o cliente fica mudo depois de qualquer queda —
// o cliente web faz o mesmo em useRealtime.
socket.on("connect", () => {
  socket.emit("channel:subscribe", { channelId: channel.id }, () => console.log("  (reinscrito apos reconexao)"));
});

socket.on("message:created", (m) => console.log(`  <- ${m.author.displayName}: ${m.content}`));

for (const texto of [
  "opa, cheguei!",
  "esse Discord aqui é nosso mesmo? 😄",
  "testando o tempo real",
]) {
  await emit("typing:start", { channelId: channel.id });
  await wait(1200);
  await emit("message:send", { channelId: channel.id, content: texto });
  console.log(`  -> Leonardo: ${texto}`);
  await wait(1500);
}

console.log("Leonardo continua conectado. Ctrl+C para sair.");
