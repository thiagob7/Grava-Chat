import type { Metadata } from "next";

import { Ahead, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { ObjectsIndex, RoutesRest } from "~/components/docs/ReferenciaDaApi";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Referência REST — Documentação do Gravaê",
  description: "Todas as rotas que um bot do Gravaê pode chamar, geradas do código da API.",
};

export default function Reference() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Referência" page="REST" />
        <Title call="Tudo abaixo de um endereço só, tudo com o mesmo cabeçalho. Esta lista é lida do código do servidor a cada build.">
          Referência REST
        </Title>
      </header>

      <Section id="endereco" title="Endereço e cabeçalho">
        <p>
          A base é <code>{API}</code>, e toda chamada leva{" "}
          <code>Authorization: Bot SEU_TOKEN</code>. Corpo é sempre JSON, com{" "}
          <code>Content-Type: application/json</code>.
        </p>
      </Section>

      <Section id="objetos" title="Por objeto">
        <p>
          Cada página reúne o que aquele objeto é, os campos que ele tem, as
          rotas que mexem nele e os eventos que ele dispara. É por aqui que a
          pergunta &ldquo;como mando uma mensagem&rdquo; se responde num lugar só.
        </p>

        <ObjectsIndex />
      </Section>

      <Section id="erros" title="Quando dá errado">
        <p>
          Todo erro volta com um <code>message</code> em português. Os códigos,
          o formato da resposta e os motivos que chegam pelo socket estão na{" "}
          <a href="/desenvolvedores/erros" className="text-brand hover:underline">
            página de erros
          </a>
          .
        </p>
      </Section>

      <Section id="tudo" title="Todas as rotas, de uma vez">
        <p>
          A lista inteira, agrupada como antes. Serve para procurar uma rota
          quando você já sabe o nome dela.
        </p>

        <RoutesRest />
      </Section>

      <Ahead href="/desenvolvedores/eventos" />
    </article>
  );
}
