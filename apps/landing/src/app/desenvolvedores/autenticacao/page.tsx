import type { Metadata } from "next";

import { Codigo } from "~/components/docs/Codigo";
import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Autenticação — Documentação do Gravaê",
  description: "O token de bot, onde ele vai e como não deixar vazar.",
};

export default function Autenticacao() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Fundamentos" pagina="Autenticação" />
        <Titulo chamada="Uma linha de cabeçalho autentica tudo: o REST e a conexão de tempo real usam o mesmo token, com o mesmo prefixo.">
          Autenticação
        </Titulo>
      </header>

      <Secao id="token" titulo="O token">
        <p>
          Ele aparece uma vez, na hora em que o aplicativo é criado. Guarde num lugar seguro: o
          Gravaê não mostra de novo. Se você perder, ou se ele vazar, gere outro na tela de
          Aplicativos — o antigo morre na hora, e toda conexão aberta com ele cai.
        </p>
      </Secao>

      <Secao id="no-rest" titulo="No REST">
        <p>
          Cabeçalho <code>Authorization</code>, com <code>Bot</code> e um espaço antes do token:
        </p>

        <Codigo>{`curl ${API}/bot/eu \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Codigo>

        <p>
          Voltou <code>botId</code> e <code>userId</code>? Está tudo certo. Voltou <code>401</code>
          ? O token está errado, foi trocado, ou faltou o <code>Bot </code> na frente.
        </p>
      </Secao>

      <Secao id="no-tempo-real" titulo="Na conexão de tempo real">
        <p>
          Mesmo token, mesmo prefixo, mas no <code>auth</code> do aperto de mão em vez de num
          cabeçalho:
        </p>

        <Codigo legenda="bot.js">{`const socket = io("https://gravaechat-api.duckdns.org", {
  transports: ["websocket"],
  auth: { token: \`Bot \${process.env.GRAVAE_TOKEN}\` },
});`}</Codigo>
      </Secao>

      <Secao id="cuidado" titulo="Onde o token não pode estar">
        <Aviso>
          Token no navegador é token público. Qualquer pessoa abre as ferramentas de
          desenvolvedor e lê. Ele mora no seu servidor, em variável de ambiente — nunca no código
          do site, nunca num repositório, nem privado.
        </Aviso>

        <p>
          Se você desconfiar que vazou, não pense muito: gere outro. Trocar o token custa um
          clique, e é a única coisa que corta o acesso de quem já copiou.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/autenticacao" />
    </article>
  );
}
