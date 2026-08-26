/**
 * Um bot do Gravaê, do começo ao fim.
 *
 * Este arquivo NÃO roda dentro do Gravaê. Ele roda onde você quiser — sua
 * máquina, uma VPS, o Replit — e se conecta de fora, igualzinho a um bot do
 * Discord. O que liga um ao outro é só o token.
 *
 *   1. No app: Configurações → Bots → criar. Copie o token (ele só aparece
 *      uma vez) e adicione o bot a um servidor seu.
 *   2. Aqui:  GRAVAE_BOT_TOKEN=<token> node bot.mjs
 *
 * Precisa de `socket.io-client` (npm i socket.io-client).
 */
import { io } from "socket.io-client";

import { instanciaUnica } from "../instancia-unica.mjs";

/// Rodar este arquivo duas vezes faz o bot responder "pong" duas vezes, e
/// nada no console explica por quê. A trava é um PID em /tmp.
instanciaUnica("bot");

const TOKEN = process.env.GRAVAE_BOT_TOKEN;
const SERVIDOR = process.env.GRAVAE_URL ?? "http://localhost:3333";

if (!TOKEN) {
  console.error("Falta o GRAVAE_BOT_TOKEN. Pegue o token em Configurações → Bots.");
  process.exit(1);
}

/// O prefixo "Bot " é o que diz ao gateway que isto não é uma sessão de
/// pessoa. Sem ele o token é lido como JWT e a conexão é recusada.
const socket = io(SERVIDOR, {
  transports: ["websocket"],
  auth: { token: `Bot ${TOKEN}` },
});

socket.on("connect", () => console.log("no ar."));
socket.on("connect_error", (erro) => console.error("não entrou:", erro.message));
socket.on("disconnect", (motivo) => console.log("caiu:", motivo));

/**
 * Responder é enviar no mesmo canal. `nonce` é seu: ele volta no
 * `message:created` para você reconhecer o que foi você que mandou.
 */
function enviar(channelId, content) {
  socket.emit("message:send", { channelId, content, nonce: crypto.randomUUID() });
}

socket.on("message:created", (mensagem) => {
  /*
    Ignorar bots — inclusive você mesmo, que também é um.

    Sem esta linha o bot responde à própria resposta, e dois bots no mesmo
    canal ficam conversando entre si até alguém desligar um deles.
  */
  if (mensagem.author.isBot) return;

  const texto = (mensagem.content ?? "").trim().toLowerCase();

  if (texto === "!ping") {
    enviar(mensagem.channelId, "pong 🏓");
  }

  if (texto.startsWith("!eco ")) {
    enviar(mensagem.channelId, mensagem.content.slice(5));
  }
});
