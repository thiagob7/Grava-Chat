import type { Metadata } from "next";

import { Ahead, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { EventsSent, EventsReceived } from "~/components/docs/ReferenciaDaApi";

export const metadata: Metadata = {
  title: "Eventos — Documentação do Gravaê",
  description: "Os eventos que um bot manda e os que ele recebe pela conexão de tempo real.",
};

export default function Events() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Referência" page="Eventos" />
        <Title call="A conexão é de mão dupla: o bot manda eventos para agir e recebe eventos para saber o que aconteceu.">
          Eventos em tempo real
        </Title>
      </header>

      <Section id="enviados" title="O que o bot envia">
        <p>
          Os campos abaixo saem dos contratos do servidor — se está aqui, é o que ele valida.
          Campo fora do formato volta no evento <code>error</code>, com o nome do evento junto.
        </p>

        <EventsSent />
      </Section>

      <Section id="recebidos" title="O que o bot recebe">
        <p>
          Nem todo evento interessa a todo bot — trate o que você vai usar e ignore o resto. Chega
          o que acontece nos servidores em que o bot foi convidado, e nos canais assinados com{" "}
          <code>channel:subscribe</code>.
        </p>

        <EventsReceived />
      </Section>

      <Ahead href="/desenvolvedores/eventos" />
    </article>
  );
}
