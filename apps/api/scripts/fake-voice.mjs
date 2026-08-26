import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const email = process.argv[2] ?? "thiago@gravae.io";
const guildName = process.argv[3] ?? "GRAVAÊ";

const api = async (path, { token, body, method = "POST" } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

const { accessToken, user } = await api("/auth/dev-login", { body: { email } });
const guild = (await api("/guilds", { token: accessToken, method: "GET" })).find((g) => g.name === guildName);
const detail = await api(`/guilds/${guild.id}`, { token: accessToken, method: "GET" });
const voice = detail.channels.find((c) => c.type === "VOICE");

const s = io(BASE, { auth: { token: accessToken }, transports: ["websocket"] });
await new Promise((r) => s.on("connect", r));
const emit = (ev, p) => new Promise((res, rej) => s.emit(ev, p, (r) => (r.ok ? res(r.data) : rej(new Error(r.error)))));

await emit("voice:join", { channelId: voice.id });
console.log(`${user.displayName} entrou em ${voice.name}`);

const segundos = Number(process.argv[4] ?? 45);
console.log(`ficando na call por ${segundos}s (Ctrl+C para sair antes)`);
await new Promise((r) => setTimeout(r, segundos * 1000));
await emit("voice:leave", {});
console.log(`${user.displayName} saiu`);
process.exit(0);
