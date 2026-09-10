import type { Metadata } from "next";

import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";

export const metadata: Metadata = {
  title: "Políticas — Documentação do Gravaê",
  description: "O que é permitido fazer com dados de quem usa o seu bot, e o que tira ele do ar.",
};

export default function Politicas() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Referência" pagina="Políticas" />
        <Titulo chamada="Você recebe dados de gente que nunca ouviu falar de você. Estas são as regras de quem publica bot aqui.">
          Políticas
        </Titulo>
      </header>

      <Aviso>
        <strong>Rascunho para revisão.</strong> Este texto descreve a intenção da
        plataforma e ainda não passou por revisão jurídica. Ele não substitui os
        termos de uso do Gravaê.
      </Aviso>

      <Secao id="dados" titulo="Dados de quem usa">
        <p>
          Guarde o mínimo, pelo menor tempo. Se o seu bot só precisa do id para
          contar pontos, guarde o id — não o nome, não a foto, não a mensagem.
        </p>

        <p>
          Não venda, alugue nem repasse dado de usuário. Não use conteúdo de
          mensagem para treinar modelo, montar perfil de publicidade ou qualquer
          coisa que a pessoa não esperaria de um bot naquele servidor.
        </p>

        <p>
          Se alguém pedir para apagar o que você guardou sobre ela, apague. Se o
          seu bot sair de um servidor, apague o que era daquele servidor.
        </p>
      </Secao>

      <Secao id="transparencia" titulo="Diga o que o bot faz">
        <p>
          A descrição do bot é onde o dono do servidor decide instalar ou não.
          Ela precisa dizer o que ele faz e o que ele guarda, em português
          simples. Bot que faz uma coisa a mais do que anuncia é bot que some.
        </p>

        <p>
          Peça só a permissão que você usa. Pedir tudo &ldquo;por precaução&rdquo;
          é o jeito mais rápido de não ser instalado, e aqui a lista do que você
          pediu aparece na tela de convite antes de qualquer clique.
        </p>
      </Secao>

      <Secao id="proibido" titulo="O que tira o bot do ar">
        <p>
          Automatizar conta de pessoa. Um bot é uma conta de bot — usar token de
          usuário para agir como se fosse gente é motivo de remoção imediata.
        </p>

        <p>
          Mandar mensagem em massa para quem não pediu. Contornar limite de
          vazão com várias contas. Copiar o histórico de um servidor para fora
          dele sem que o dono saiba. Coletar dados de membros para revender.
        </p>

        <p>
          Conteúdo ilegal, assédio, engano sobre quem você é — o que vale para
          gente vale para bot, e a responsabilidade é de quem publicou.
        </p>
      </Secao>

      <Secao id="seguranca" titulo="O token é seu problema">
        <p>
          Token vazado é conta comprometida. Ele mora em variável de ambiente, no
          servidor, e nunca em código versionado, front-end ou print de tela.
        </p>

        <p>
          Se vazar, gere outro imediatamente no painel — o anterior morre na
          hora. Nós não conseguimos recuperar o que um token vazado fez.
        </p>
      </Secao>

      <Secao id="mudanca" titulo="Se algo mudar">
        <p>
          Mudança na API aparece no registro de mudanças antes de valer, e nada é
          removido sem aviso. Mudança nestas regras aparece no mesmo lugar.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/mudancas" />
    </article>
  );
}
