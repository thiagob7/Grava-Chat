import { pathToFileURL } from "node:url";
import { io } from "socket.io-client";

import { instanciaUnica } from "../instancia-unica.mjs";

export const isMain = (moduleUrl) => Boolean(process.argv[1]) && moduleUrl === pathToFileURL(process.argv[1]).href;

export function startBot(name) {
  instanciaUnica(name);

  const token = process.env.GRAVAE_BOT_TOKEN;
  const server = process.env.GRAVAE_URL ?? "http://localhost:3333";

  if (!token) {
    console.error("Missing GRAVAE_BOT_TOKEN. Get the token in Settings → Bots.");
    process.exit(1);
  }

  const socket = io(server, { transports: ["websocket"], auth: { token: `Bot ${token}` } });

  socket.on("connect", () => console.log(`${name}: connected`));
  socket.on("connect_error", (error) => console.error(`${name}: could not connect:`, error.message));
  socket.on("disconnect", (reason) => console.log(`${name}: disconnected:`, reason));

  async function api(method, path, body) {
    const response = await fetch(`${server}/api${path}`, {
      method,
      headers: { Authorization: `Bot ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${data?.message ?? text}`);
    return data;
  }

  const respond = (interaction, body) =>
    api("POST", `/bot/interactions/${interaction.id}/${interaction.token}/callback`, body);

  const guard = (label, handler) => async (payload) => {
    try {
      await handler(payload);
    } catch (error) {
      console.error(`${name}: ${label} failed:`, error.message);
    }
  };

  return {
    socket,
    api,
    reply: (interaction, data) => respond(interaction, { type: "reply", data }),
    replyPrivately: (interaction, content) => respond(interaction, { type: "reply", data: { content, ephemeral: true } }),
    update: (interaction, data) => respond(interaction, { type: "update", data }),
    defer: (interaction) => respond(interaction, { type: "defer" }),
    openModal: (interaction, data) => respond(interaction, { type: "modal", data }),
    setCommands: (commands) => api("PUT", "/bot/comandos", { commands }),
    onReady: (handler) => socket.on("connect", guard("ready", handler)),
    onCommand: (handler) => socket.on("command:invoked", guard("command", handler)),
    onInteraction: (handler) => socket.on("interaction:created", guard("interaction", handler)),
  };
}
