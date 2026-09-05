import type { Metadata } from "next";

import { Codigo } from "~/components/docs/Codigo";
import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";

export const metadata: Metadata = {
  title: "Tempo real — Documentação do Gravaê",
  description: "A conexão que faz o bot reagir sozinho ao que acontece no servidor.",
};

export default function TempoReal() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Guias" pagina="Tempo real" />
        <Titulo chamada="É Socket.IO sobre WebSocket. Uma conexão aberta que recebe o que acontece e por onde o bot também pode agir, sem passar pelo REST.">
          Tempo real
        </Titulo>
      </header>

      <Secao id="ligar" titulo="Ligue a conexão">
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
          O <code>transports: ["websocket"]</code> não é enfeite: o servidor só aceita WebSocket,
          sem a sondagem por HTTP que o Socket.IO tenta primeiro por padrão.
        </p>
      </Secao>

      <Secao id="o-que-chega" titulo="O que chega sozinho">
        <p>
          Assim que a conexão sobe, o bot já recebe o que acontece nos servidores em que foi
          convidado — gente entrando e saindo, canais criados, chamadas começando. Para acompanhar
          as mensagens de um canal específico, mande{" "}
          <code>channel:subscribe</code> com o <code>channelId</code>:
        </p>

        <Codigo legenda="bot.js">{`socket.emit("channel:subscribe", { channelId });`}</Codigo>

        <p>
          E <code>channel:unsubscribe</code> quando não interessar mais. Assinar canal que você não
          vai usar é só trabalho para os dois lados.
        </p>
      </Secao>

      <Secao id="erros" titulo="Escute o error">
        <Aviso>
          Um evento que o servidor recusa não volta como exceção nem como resposta: volta no evento{" "}
          <code>error</code>, com o nome do evento que falhou e o motivo. Sem escutar{" "}
          <code>error</code>, o seu bot falha em silêncio e você fica olhando para um log vazio.
        </Aviso>

        <p>
          Nem toda recusa é bug — algumas são só corrida de estado, como sair de uma chamada de
          onde você já tinha saído. Essas o servidor engole de propósito, para não virar aviso na
          tela de ninguém.
        </p>
      </Secao>

      <Secao id="queda" titulo="Quando a conexão cai">
        <p>
          O Socket.IO reconecta sozinho. O que ele não faz é lembrar o que você tinha assinado:
          depois de reconectar, mande os <code>channel:subscribe</code> de novo. O jeito seguro é
          guardar a lista e reenviá-la no <code>connect</code>, que dispara em toda reconexão.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/tempo-real" />
    </article>
  );
}
