import type { Metadata } from "next";

import { Adiante, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { IndiceDeObjetos, RotasRest } from "~/components/docs/ReferenciaDaApi";
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

      <Secao id="objetos" titulo="Por objeto">
        <p>
          Cada página reúne o que aquele objeto é, os campos que ele tem, as
          rotas que mexem nele e os eventos que ele dispara. É por aqui que a
          pergunta &ldquo;como mando uma mensagem&rdquo; se responde num lugar só.
        </p>

        <IndiceDeObjetos />
      </Secao>

      <Secao id="erros" titulo="Quando dá errado">
        <p>
          Todo erro volta com um <code>message</code> em português. Os códigos,
          o formato da resposta e os motivos que chegam pelo socket estão na{" "}
          <a href="/desenvolvedores/erros" className="text-brand hover:underline">
            página de erros
          </a>
          .
        </p>
      </Secao>

      <Secao id="tudo" titulo="Todas as rotas, de uma vez">
        <p>
          A lista inteira, agrupada como antes. Serve para procurar uma rota
          quando você já sabe o nome dela.
        </p>

        <RotasRest />
      </Secao>

      <Adiante href="/desenvolvedores/eventos" />
    </article>
  );
}
