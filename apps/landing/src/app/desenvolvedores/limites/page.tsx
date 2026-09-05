import type { Metadata } from "next";

import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { TabelaDeLimites } from "~/components/docs/TabelaDeLimites";
import { REPO } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Limites — Documentação do Gravaê",
  description: "Vazão, tamanhos e tetos que o servidor do Gravaê aplica.",
};

export default function Limites() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Referência" pagina="Limites" />
        <Titulo chamada="Os números que o servidor aplica de verdade, lidos das constantes que o aplicativo usa.">
          Limites
        </Titulo>
      </header>

      <Secao id="vazao" titulo="Vazão">
        <p>
          São <strong className="text-ink">300 requisições por minuto</strong> por endereço de IP,
          contando REST. Estourou, a API responde <code>429</code> com um{" "}
          <code>message</code> dizendo em quantos segundos você pode voltar.
        </p>

        <Aviso>
          Respeite o número que vem na resposta em vez de tentar de novo na hora. Um bot que insiste
          num <code>429</code> só empurra a própria espera para frente — e, como a conta é por IP,
          leva junto todo mundo que sai da mesma máquina.
        </Aviso>
      </Secao>

      <Secao id="tamanhos" titulo="Tamanhos e tetos">
        <TabelaDeLimites />
      </Secao>

      <Secao id="mais" titulo="Se você precisa de mais">
        <p>
          O Gravaê roda em duas máquinas pequenas e o código é aberto. Se o seu bot precisa de mais
          fôlego do que isso,{" "}
          <a
            href={`${REPO}/issues/new`}
            target="_blank"
            rel="noreferrer"
            className="text-brand transition hover:text-brand-hover"
          >
            abra uma issue
          </a>{" "}
          antes de ligar — dá pra combinar.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/limites" />
    </article>
  );
}
