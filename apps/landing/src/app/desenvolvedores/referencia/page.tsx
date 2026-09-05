import type { Metadata } from "next";

import { Adiante, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { RotasRest } from "~/components/docs/ReferenciaDaApi";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Referência REST — Documentação do Gravaê",
  description: "Todas as rotas que um bot do Gravaê pode chamar, geradas do código da API.",
};

export default function Referencia() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Referência" pagina="REST" />
        <Titulo chamada="Tudo abaixo de um endereço só, tudo com o mesmo cabeçalho. Esta lista é lida do código do servidor a cada build.">
          Referência REST
        </Titulo>
      </header>

      <Secao id="endereco" titulo="Endereço e cabeçalho">
        <p>
          A base é <code>{API}</code>, e toda chamada leva{" "}
          <code>Authorization: Bot SEU_TOKEN</code>. Corpo é sempre JSON, com{" "}
          <code>Content-Type: application/json</code>.
        </p>
      </Secao>

      <Secao id="rotas" titulo="As rotas">
        <RotasRest />
      </Secao>

      <Secao id="erros" titulo="Quando dá errado">
        <p>
          <code>401</code> é token ausente, errado ou já trocado. <code>403</code> é bot fora do
          servidor, ou mexendo em mensagem que não é dele. <code>404</code> é canal ou mensagem que
          não existe. <code>429</code> é vazão estourada. Todo erro vem com um{" "}
          <code>message</code> em português dizendo o quê.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/referencia" />
    </article>
  );
}
