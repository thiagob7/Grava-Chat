import type { Metadata } from "next";

import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";

export const metadata: Metadata = {
  title: "Aplicativos e bots — Documentação do Gravaê",
  description: "Como nasce um aplicativo do Gravaê, e como ele entra num servidor.",
};

export default function Aplicativos() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Fundamentos" pagina="Aplicativos e bots" />
        <Titulo chamada="Aplicativo é o cadastro; bot é o usuário que ele controla. Os dois nascem juntos, na mesma tela, e não dá para ter um sem o outro.">
          Aplicativos e bots
        </Titulo>
      </header>

      <Secao id="criar" titulo="Crie o aplicativo">
        <p>
          No Gravaê, vá em <strong className="text-ink">Configurações</strong> →{" "}
          <strong className="text-ink">Desenvolvedor</strong> →{" "}
          <strong className="text-ink">Aplicativos</strong>. Você escolhe o nome, e junto com o
          cadastro o Gravaê cria o usuário que vai aparecer nas conversas — com foto, apelido e
          perfil, como qualquer pessoa.
        </p>
        <p>
          Essa tela é o portal do desenvolvedor: é dela que sai o token, é nela que se trocam a
          foto e a descrição, e é por ela que se apaga o aplicativo quando ele não serve mais.
        </p>
      </Secao>

      <Secao id="convite" titulo="Ponha o bot num servidor">
        <p>
          O bot não entra sozinho, e não enxerga servidor onde não foi convidado. Na mesma tela sai
          um <strong className="text-ink">link de convite</strong> — quem tem permissão de
          gerenciar o servidor abre o link, escolhe onde, e pronto.
        </p>
        <p>
          O convite carrega as permissões que o aplicativo pede. Quem convida vê a lista antes de
          confirmar, então peça só o que o bot usa: um bot que só manda mensagem pedindo para banir
          membros é um bot que ninguém convida.
        </p>
      </Secao>

      <Secao id="o-que-ele-ve" titulo="O que o bot enxerga">
        <p>
          O mesmo que um membro enxergaria com aqueles cargos. Canal que o cargo dele não vê, ele
          não vê; mensagem de canal fechado, ele não recebe. Não existe token que passe por cima
          das permissões do servidor.
        </p>

        <Aviso>
          Rota que mexe em mensagem só aceita mensagem do próprio bot. Para apagar mensagem dos
          outros, o bot precisa da permissão de gerenciar mensagens — e mesmo assim é pelo caminho
          normal de moderação, não por ser bot.
        </Aviso>
      </Secao>

      <Adiante href="/desenvolvedores/aplicativos" />
    </article>
  );
}
