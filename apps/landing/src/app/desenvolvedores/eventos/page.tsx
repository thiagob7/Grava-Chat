import type { Metadata } from "next";

import { Adiante, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { EventosEnviados, EventosRecebidos } from "~/components/docs/ReferenciaDaApi";

export const metadata: Metadata = {
  title: "Eventos — Documentação do Gravaê",
  description: "Os eventos que um bot manda e os que ele recebe pela conexão de tempo real.",
};

export default function Eventos() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Referência" pagina="Eventos" />
        <Titulo chamada="A conexão é de mão dupla: o bot manda eventos para agir e recebe eventos para saber o que aconteceu.">
          Eventos em tempo real
        </Titulo>
      </header>

      <Secao id="enviados" titulo="O que o bot envia">
        <p>
          Os campos abaixo saem dos contratos do servidor — se está aqui, é o que ele valida.
          Campo fora do formato volta no evento <code>error</code>, com o nome do evento junto.
        </p>

        <EventosEnviados />
      </Secao>

      <Secao id="recebidos" titulo="O que o bot recebe">
        <p>
          Nem todo evento interessa a todo bot — trate o que você vai usar e ignore o resto. Chega
          o que acontece nos servidores em que o bot foi convidado, e nos canais assinados com{" "}
          <code>channel:subscribe</code>.
        </p>

        <EventosRecebidos />
      </Secao>

      <Adiante href="/desenvolvedores/eventos" />
    </article>
  );
}
