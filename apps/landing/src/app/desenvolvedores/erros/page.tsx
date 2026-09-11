import type { Metadata } from "next";

import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { ErrorCodes, FailureReasons } from "~/components/docs/ReferenciaDaApi";

export const metadata: Metadata = {
  title: "Erros — Documentação do Gravaê",
  description:
    "O que a API responde quando dá errado: os códigos HTTP, o formato do corpo e os motivos que vêm nos eventos.",
};

export default function Errors() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Referência" page="Erros" />
        <Title call="Toda falha volta no mesmo formato. Saber lê-lo é o que separa um bot que se recupera de um que trava.">
          Erros
        </Title>
      </header>

      <Section id="formato" title="O formato">
        <p>
          Qualquer erro da API volta como JSON com um campo <code>message</code>, em
          português e escrito para ser mostrado a uma pessoa. Erro de validação traz
          também <code>issues</code>, com o caminho do campo e o motivo, um por item.
        </p>

        <pre className="overflow-x-auto rounded-lg border border-line bg-surface-1 p-4 text-13">
          <code>{`{
  "message": "Você não pode escrever neste canal"
}

{
  "message": "id invalido",
  "issues": [{ "path": "channelId", "message": "id invalido" }]
}`}</code>
        </pre>
      </Section>

      <Section id="codigos" title="Códigos">
        <p>
          O código diz o que fazer. Os da faixa 400 são seus para corrigir; o 500 é
          nosso.
        </p>

        <ErrorCodes />

        <Notice>
          <strong>403 e 404 são a mesma resposta de propósito.</strong> Canal que o bot
          não pode enxergar responde &quot;não encontrado&quot;, e não &quot;sem
          permissão&quot;. Dizer a diferença confirmaria a existência do canal para
          quem está tateando.
        </Notice>
      </Section>

      <Section id="motivos" title="Motivos, no tempo real">
        <p>
          Pelo socket não existe código HTTP. No lugar dele vem o evento{" "}
          <code>error</code>, com o nome do evento que falhou e um{" "}
          <code>motivo</code> desta lista fechada. A lista é fechada de propósito: dá
          para tratar todos com um <code>switch</code> e ter certeza de que não
          escapou nenhum.
        </p>

        <FailureReasons />
      </Section>

      <Section id="reagir" title="Quando insistir">
        <p>
          Nem toda falha merece nova tentativa. Insistir em{" "}
          <code>sem-permissao</code> só gasta o limite de velocidade, porque a resposta
          será a mesma até alguém mudar o cargo do bot. Já{" "}
          <code>sem-conexao</code>, <code>modo-lento</code>, <code>depressa</code> e{" "}
          <code>erro</code> passam sozinhos.
        </p>

        <p>
          O pacote compartilhado exporta <code>adiantaInsistir(motivo)</code>, que
          responde isso sem você precisar decorar a lista.
        </p>
      </Section>

      <Ahead href="/desenvolvedores/limites" />
    </article>
  );
}
