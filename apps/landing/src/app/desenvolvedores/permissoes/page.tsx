import type { Metadata } from "next";

import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { TabelaDePermissoes } from "~/components/docs/TabelaDePermissoes";

export const metadata: Metadata = {
  title: "Permissões — Documentação do Gravaê",
  description: "As 33 permissões do Gravaê, o que cada uma libera e quais já vêm de fábrica.",
};

export default function Permissoes() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Fundamentos" pagina="Permissões" />
        <Titulo chamada="O que um bot consegue fazer é o que os cargos dele permitem — a mesma conta que vale para gente vale para código.">
          Permissões
        </Titulo>
      </header>

      <Secao id="como-somam" titulo="Como elas somam">
        <p>
          Um membro carrega a soma das permissões de todos os seus cargos. Em cima disso, cada
          canal pode ter exceções: um canal libera para um cargo o que o servidor negava, ou nega o
          que o servidor liberava. A exceção do canal vence a regra do servidor.
        </p>
        <p>
          <code>ADMINISTRATOR</code> passa por cima de tudo, exceções de canal incluídas. Um bot
          com administrador é um bot que pode apagar o servidor inteiro — só peça se ele realmente
          precisar.
        </p>

        <Aviso>
          As marcadas como <strong className="text-ink">de fábrica</strong> já vêm ligadas no cargo
          de todo mundo. Não vale pedir essas no convite: o bot já as tem no instante em que entra,
          e pedir só faz a lista parecer maior do que precisa.
        </Aviso>
      </Secao>

      <Secao id="lista" titulo="A lista">
        <TabelaDePermissoes />
      </Secao>

      <Adiante href="/desenvolvedores/permissoes" />
    </article>
  );
}
