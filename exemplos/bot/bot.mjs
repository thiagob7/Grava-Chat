import { io } from "socket.io-client";

import { instanciaUnica } from "../instancia-unica.mjs";

instanciaUnica("bot");

const TOKEN = process.env.GRAVAE_BOT_TOKEN;
const SERVIDOR = process.env.GRAVAE_URL ?? "http://localhost:3333";

if (!TOKEN) {
  console.error("Falta o GRAVAE_BOT_TOKEN. Pegue o token em Configurações → Bots.");
  process.exit(1);
}

const socket = io(SERVIDOR, {
  transports: ["websocket"],
  auth: { token: `Bot ${TOKEN}` },
});

socket.on("connect", () => console.log("no ar."));
socket.on("connect_error", (erro) => console.error("não entrou:", erro.message));
socket.on("disconnect", (motivo) => console.log("caiu:", motivo));

function enviar(channelId, content) {
  socket.emit("message:send", { channelId, content, nonce: crypto.randomUUID() });
}

socket.on("message:created", (mensagem) => {
  if (mensagem.author.isBot) return;

  const texto = (mensagem.content ?? "").trim().toLowerCase();

  if (texto === "!ping") {
    enviar(mensagem.channelId, "pong 🏓");
  }

  if (texto.startsWith("!eco ")) {
    enviar(mensagem.channelId, mensagem.content.slice(5));
  }
});
