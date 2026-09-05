import type { Metadata } from "next";

import { Codigo } from "~/components/Codigo";
import { Adiante, CabecalhoDaPagina, Secao } from "~/components/PaginaDosDocs";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Seu primeiro bot — Gravaê",
  description: "Do token à primeira mensagem, com a conexão de tempo real e comandos de barra.",
};

export default function PrimeiroBot() {
  return (
    <>
      <CabecalhoDaPagina
        titulo="Seu primeiro bot"
        chamada="Com o token na mão, dá pra mandar a primeira mensagem em três comandos. Depois a gente liga a conexão de tempo real, que é o que faz o bot reagir sozinho."
      />

      <Secao id="quem-sou" titulo="Confirme o token">
        <p>Antes de qualquer coisa, pergunte quem é o bot:</p>

        <Codigo>{`curl ${API}/bot/eu \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Codigo>

        <p>
          Voltou <code>botId</code> e <code>userId</code>? Está de pé. Voltou{" "}
          <code>401</code>? O token está errado ou foi trocado.
        </p>
      </Secao>

      <Secao id="canal" titulo="Ache um canal">
        <p>
          <code>/bot/servidores</code> lista onde o bot foi convidado, e cada servidor tem seus
          canais:
        </p>

        <Codigo>{`curl ${API}/bot/servidores \\
  -H "Authorization: Bot $GRAVAE_TOKEN"

curl ${API}/bot/servidores/$SERVIDOR/canais \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Codigo>

        <p>
          Lista vazia quer dizer que ninguém convidou o bot ainda — volte no link de convite da
          tela de Aplicativos.
        </p>
      </Secao>

      <Secao id="falar" titulo="Fale">
        <Codigo>{`curl -X POST ${API}/bot/canais/$CANAL/mensagens \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"content":"oi, cheguei"}'`}</Codigo>

        <p>
          Pronto, o bot falou. A mensagem aparece na hora para quem estiver com o canal aberto —
          o mesmo caminho de uma mensagem de gente.
        </p>
      </Secao>

      <Secao id="ouvir" titulo="Ficar ouvindo">
        <p>
          Pelo REST o bot só fala quando você manda. Para ele reagir ao que acontece, abra uma
          conexão de tempo real — é Socket.IO, e o token vai no <code>auth</code> do aperto de
          mão, com o mesmo prefixo <code>Bot</code>:
        </p>

        <Codigo legenda="bot.js">{`import { io } from "socket.io-client";

const socket = io("https://gravaechat-api.duckdns.org", {
  transports: ["websocket"],
  auth: { token: \`Bot \${process.env.GRAVAE_TOKEN}\` },
});

socket.on("connect", () => console.log("de pé"));

socket.on("message:created", (msg) => {
  if (msg.content === "!ping") {
    socket.emit("message:send", { channelId: msg.channelId, content: "pong" });
  }
});

socket.on("error", ({ event, message }) => {
  console.error(event, message);
});`}</Codigo>

        <p>
          O bot já entra escutando os servidores onde foi convidado. Para acompanhar um canal
          específico, mande <code>channel:subscribe</code> com o <code>channelId</code>.
        </p>
        <p>
          Cuide do <code>error</code>: é por ele que o servidor conta que o seu evento não passou,
          e sem ouvir esse evento a sua conexão fica falhando em silêncio.
        </p>
      </Secao>

      <Secao id="comandos" titulo="Comandos de barra">
        <p>
          Registre a lista de comandos uma vez. O <code>PUT</code> substitui inteira a lista
          anterior — mandar um array vazio apaga todos:
        </p>

        <Codigo>{`curl -X PUT ${API}/bot/comandos \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"comandos":[{"nome":"clima","descricao":"O tempo agora"}]}'`}</Codigo>

        <p>
          Quando alguém usa o comando, chega <code>command:invoked</code> com o canal, o
          servidor, quem chamou e as opções. Responder é mandar uma mensagem no canal que veio no
          evento.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/primeiro-bot" />
    </>
  );
}
