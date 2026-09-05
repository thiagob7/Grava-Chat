import type { Metadata } from "next";

import { Adiante, CabecalhoDaPagina, Secao } from "~/components/PaginaDosDocs";
import { EventosEnviados, EventosRecebidos } from "~/components/ReferenciaDaApi";

export const metadata: Metadata = {
  title: "Eventos em tempo real — Gravaê",
  description: "Os eventos que um bot manda e os que ele recebe pela conexão de tempo real.",
};

export default function Eventos() {
  return (
    <>
      <CabecalhoDaPagina
        titulo="Eventos em tempo real"
        chamada="A conexão de Socket.IO é uma via de mão dupla: o bot manda eventos para agir e recebe eventos para saber o que aconteceu."
      />

      <Secao id="enviados" titulo="O que o bot envia">
        <p>
          Os campos abaixo são os que cada evento espera. Campo fora do formato volta como{" "}
          <code>error</code>, com o nome do evento junto — por isso vale sempre escutar{" "}
          <code>error</code>.
        </p>

        <EventosEnviados />
      </Secao>

      <Secao id="recebidos" titulo="O que o bot recebe">
        <p>
          Nem todo evento interessa a todo bot — escute o que você vai usar e ignore o resto. O
          bot recebe o que acontece nos servidores em que foi convidado, e nos canais que ele
          assinou com <code>channel:subscribe</code>.
        </p>

        <EventosRecebidos />
      </Secao>

      <Adiante href="/desenvolvedores/eventos" />
    </>
  );
}
