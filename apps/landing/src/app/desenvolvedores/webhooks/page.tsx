import type { Metadata } from "next";

import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { Code } from "~/components/docs/Codigo";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Webhooks — Documentação do Gravaê",
  description:
    "Um endereço que escreve num canal sem bot conectado, sem token de conta e sem biblioteca.",
};

export default function Webhooks() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Guias" page="Webhooks" />
        <Title call="A forma mais simples de um sistema de fora falar dentro do Gravaê: um endereço, um POST, uma mensagem.">
          Webhooks
        </Title>
      </header>

      <Section id="quando" title="Quando usar um, e quando usar um bot">
        <p>
          Webhook <strong>só escreve</strong>, sempre no mesmo canal, e não lê
          nada. Não tem conexão aberta, não recebe evento, não responde a comando.
          Em troca, não exige bot, nem biblioteca, nem processo rodando: um{" "}
          <code>curl</code> resolve.
        </p>

        <p>
          Então: aviso de build quebrado, alerta de monitoramento, resumo diário
          e notificação de venda são webhook. Qualquer coisa que precise{" "}
          <em>reagir</em> — responder alguém, moderar, ler histórico — é bot.
        </p>
      </Section>

      <Section id="criar" title="Criando">
        <p>
          Pelo app, no menu do canal, ou pela API do bot. As duas rotas pedem a
          permissão <code>MANAGE_WEBHOOKS</code> no servidor.
        </p>

        <Code>{`curl -X POST ${API}/bot/servidores/SEU_SERVIDOR/webhooks \\
  -H "Authorization: Bot SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "Avisos do build", "channelId": "ID_DO_CANAL" }'`}</Code>

        <p>
          A resposta traz o <code>id</code> e o <code>token</code>. Os dois juntos
          formam o endereço de envio, e é a única vez que o token aparece.
        </p>
      </Section>

      <Section id="enviar" title="Enviando">
        <p>
          O endereço de envio <strong>não leva cabeçalho de autenticação</strong>:
          o token está no próprio caminho.
        </p>

        <Code>{`curl -X POST ${API}/webhooks/ID_DO_WEBHOOK/TOKEN \\
  -H "Content-Type: application/json" \\
  -d '{ "content": "Build 482 quebrou no passo de testes." }'`}</Code>

        <p>
          Três campos são aceitos. <code>content</code> é o texto, com o mesmo
          limite de tamanho de qualquer mensagem. <code>username</code> troca o
          nome exibido, até 48 caracteres. <code>avatar_url</code> troca a foto.
          Os dois últimos valem só para aquela mensagem, e servem para um mesmo
          webhook falar com caras diferentes — &ldquo;Monitoramento&rdquo; num
          aviso, &ldquo;Financeiro&rdquo; noutro.
        </p>

        <p>
          A resposta é <code>201</code> com o <code>id</code> da mensagem criada.
          Quem estiver com o canal aberto recebe ela na hora, pelo mesmo evento{" "}
          <code>message:created</code> de sempre — para quem lê, não há diferença
          entre mensagem de webhook e mensagem de gente.
        </p>
      </Section>

      <Section id="segredo" title="O token é a senha">
        <p>
          Quem tem o endereço escreve naquele canal, sem mais nada. Não há
          segunda barreira: o token no caminho <em>é</em> a autenticação.
        </p>

        <Notice>
          <strong>Nunca ponha o endereço no navegador.</strong> Front-end é código
          aberto para quem abre as ferramentas de desenvolvedor. Webhook mora no
          servidor, em variável de ambiente. Se vazar, apague o webhook e crie
          outro — o token não se troca sozinho.
        </Notice>
      </Section>

      <Section id="limites" title="Limites">
        <p>
          Vale a mesma vazão das outras rotas. Sistema que dispara muito aviso
          junto deve juntar num texto só em vez de mandar vinte seguidos: além de
          não estourar o limite, o canal fica legível.
        </p>
      </Section>

      <Ahead href="/desenvolvedores/referencia/webhook" />
    </article>
  );
}
