import type { Metadata } from "next";

import { Code } from "~/components/docs/Codigo";
import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";

export const metadata: Metadata = {
  title: "Tempo real — Documentação do Gravaê",
  description: "A conexão que faz o bot reagir sozinho ao que acontece no servidor.",
};

export default function TempoReal() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Guias" page="Tempo real" />
        <Title call="É Socket.IO sobre WebSocket. Uma conexão aberta que recebe o que acontece e por onde o bot também pode agir, sem passar pelo REST.">
          Tempo real
        </Title>
      </header>

      <Section id="ligar" title="Ligue a conexão">
        <Code legenda="bot.js">{`import { io } from "socket.io-client";

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
});`}</Code>

        <p>
          O <code>transports: ["websocket"]</code> não é enfeite: o servidor só aceita WebSocket,
          sem a sondagem por HTTP que o Socket.IO tenta primeiro por padrão.
        </p>
      </Section>

      <Section id="o-que-chega" title="O que chega sozinho">
        <p>
          Assim que a conexão sobe, o bot já recebe o que acontece nos servidores em que foi
          convidado — gente entrando e saindo, canais criados, chamadas começando. Para acompanhar
          as mensagens de um canal específico, mande{" "}
          <code>channel:subscribe</code> com o <code>channelId</code>:
        </p>

        <Code legenda="bot.js">{`socket.emit("channel:subscribe", { channelId });`}</Code>

        <p>
          E <code>channel:unsubscribe</code> quando não interessar mais. Assinar canal que você não
          vai usar é só trabalho para os dois lados.
        </p>
      </Section>

      <Section id="erros" title="Escute o error">
        <Notice>
          Um evento que o servidor recusa não volta como exceção nem como resposta: volta no evento{" "}
          <code>error</code>, com o nome do evento que falhou e o motivo. Sem escutar{" "}
          <code>error</code>, o seu bot falha em silêncio e você fica olhando para um log vazio.
        </Notice>

        <p>
          Nem toda recusa é bug — algumas são só corrida de estado, como sair de uma chamada de
          onde você já tinha saído. Essas o servidor engole de propósito, para não virar aviso na
          tela de ninguém.
        </p>
      </Section>

      <Section id="queda" title="Quando a conexão cai">
        <p>
          O Socket.IO reconecta sozinho. O que ele não faz é lembrar o que você tinha assinado:
          depois de reconectar, mande os <code>channel:subscribe</code> de novo. O jeito seguro é
          guardar a lista e reenviá-la no <code>connect</code>, que dispara em toda reconexão.
        </p>
      </Section>

      <Ahead href="/desenvolvedores/tempo-real" />
    </article>
  );
}
