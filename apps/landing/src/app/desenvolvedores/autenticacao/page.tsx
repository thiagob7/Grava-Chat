import type { Metadata } from "next";

import { Code } from "~/components/docs/Codigo";
import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Autenticação — Documentação do Gravaê",
  description: "O token de bot, onde ele vai e como não deixar vazar.",
};

export default function Authentication() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Fundamentos" page="Autenticação" />
        <Title call="Uma linha de cabeçalho autentica tudo: o REST e a conexão de tempo real usam o mesmo token, com o mesmo prefixo.">
          Autenticação
        </Title>
      </header>

      <Section id="token" title="O token">
        <p>
          Ele aparece uma vez, na hora em que o aplicativo é criado. Guarde num lugar seguro: o
          Gravaê não mostra de novo. Se você perder, ou se ele vazar, gere outro na tela de
          Aplicativos — o antigo morre na hora, e toda conexão aberta com ele cai.
        </p>
      </Section>

      <Section id="no-rest" title="No REST">
        <p>
          Cabeçalho <code>Authorization</code>, com <code>Bot</code> e um espaço antes do token:
        </p>

        <Code>{`curl ${API}/bot/eu \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Code>

        <p>
          Voltou <code>botId</code> e <code>userId</code>? Está tudo certo. Voltou <code>401</code>
          ? O token está errado, foi trocado, ou faltou o <code>Bot </code> na frente.
        </p>
      </Section>

      <Section id="no-tempo-real" title="Na conexão de tempo real">
        <p>
          Mesmo token, mesmo prefixo, mas no <code>auth</code> do aperto de mão em vez de num
          cabeçalho:
        </p>

        <Code legenda="bot.js">{`const socket = io("https://gravaechat-api.duckdns.org", {
  transports: ["websocket"],
  auth: { token: \`Bot \${process.env.GRAVAE_TOKEN}\` },
});`}</Code>
      </Section>

      <Section id="cuidado" title="Onde o token não pode estar">
        <Notice>
          Token no navegador é token público. Qualquer pessoa abre as ferramentas de
          desenvolvedor e lê. Ele mora no seu servidor, em variável de ambiente — nunca no código
          do site, nunca num repositório, nem privado.
        </Notice>

        <p>
          Se você desconfiar que vazou, não pense muito: gere outro. Trocar o token custa um
          clique, e é a única coisa que corta o acesso de quem já copiou.
        </p>
      </Section>

      <Ahead href="/desenvolvedores/autenticacao" />
    </article>
  );
}
