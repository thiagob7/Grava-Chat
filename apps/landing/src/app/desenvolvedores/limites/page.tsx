import type { Metadata } from "next";

import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { LimitsTable } from "~/components/docs/TabelaDeLimites";
import { REPO } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Limites — Documentação do Gravaê",
  description: "Vazão, tamanhos e tetos que o servidor do Gravaê aplica.",
};

export default function Limits() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Referência" page="Limites" />
        <Title call="Os números que o servidor aplica de verdade, lidos das constantes que o aplicativo usa.">
          Limites
        </Title>
      </header>

      <Section id="vazao" title="Vazão">
        <p>
          São <strong className="text-ink">300 requisições por minuto</strong> por endereço de IP,
          contando REST. Estourou, a API responde <code>429</code> com um{" "}
          <code>message</code> dizendo em quantos segundos você pode voltar.
        </p>

        <Notice>
          Respeite o número que vem na resposta em vez de tentar de novo na hora. Um bot que insiste
          num <code>429</code> só empurra a própria espera para frente — e, como a conta é por IP,
          leva junto todo mundo que sai da mesma máquina.
        </Notice>
      </Section>

      <Section id="tamanhos" title="Tamanhos e tetos">
        <LimitsTable />
      </Section>

      <Section id="mais" title="Se você precisa de mais">
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
      </Section>

      <Ahead href="/desenvolvedores/limites" />
    </article>
  );
}
