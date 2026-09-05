import type { Metadata } from "next";

import { Adiante, CabecalhoDaPagina, Secao } from "~/components/PaginaDosDocs";
import { RotasRest } from "~/components/ReferenciaDaApi";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Referência REST — Gravaê",
  description: "Todas as rotas que um bot do Gravaê pode chamar, geradas do código da API.",
};

export default function Referencia() {
  return (
    <>
      <CabecalhoDaPagina
        titulo="Referência REST"
        chamada="Tudo abaixo de um endereço só, tudo com o mesmo cabeçalho. Rota que mexe em mensagem só aceita mensagem do próprio bot."
      />

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
          servidor, ou mexendo em mensagem que não é dele. <code>404</code> é canal ou mensagem
          que não existe. Todo erro vem com um <code>message</code> em português dizendo o quê.
        </p>
      </Secao>

      <Secao id="limites" titulo="Limites">
        <p>
          São 300 requisições por minuto por endereço de IP. Estourou, a API responde{" "}
          <code>429</code> dizendo em quantos segundos você pode voltar — respeite o número em
          vez de tentar de novo na hora.
        </p>
        <p>
          O Gravaê roda em duas máquinas pequenas e o código é aberto. Se o seu bot precisa de
          mais fôlego do que isso,{" "}
          <a
            href="https://github.com/thiagob7/Grava-Chat/issues/new"
            target="_blank"
            rel="noreferrer"
            className="text-brand transition hover:text-brand-hover"
          >
            abra uma issue
          </a>{" "}
          antes de ligar — dá pra combinar.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/referencia" />
    </>
  );
}
