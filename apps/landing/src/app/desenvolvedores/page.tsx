import type { Metadata } from "next";

import { Codigo } from "~/components/Codigo";
import { Adiante, CabecalhoDaPagina, Secao } from "~/components/PaginaDosDocs";

export const metadata: Metadata = {
  title: "Desenvolvedores — Gravaê",
  description: "O que é um bot do Gravaê, como criar o aplicativo e onde fica o token.",
};

export default function Introducao() {
  return (
    <>
      <CabecalhoDaPagina
        titulo="Construa no Gravaê"
        chamada="Um bot do Gravaê é um usuário como qualquer outro: entra em servidores, lê canais, manda mensagem, reage e responde a comandos de barra. A diferença é que ele se identifica com um token em vez de uma sessão, e por isso não precisa ficar com uma janela aberta."
      />

      <Secao id="de-onde-vem" titulo="De onde vem esta documentação">
        <p>
          Tudo o que está aqui sai do próprio código da API — as rotas lidas do servidor, os
          campos de cada evento convertidos dos contratos. Se um campo aparece nestas páginas,
          ele existe lá. E rota nova sem descrição derruba o build do site, então a referência
          não tem como envelhecer calada.
        </p>
      </Secao>

      <Secao id="aplicativo" titulo="Crie o aplicativo">
        <p>
          Abra o Gravaê, vá em <strong className="text-ink">Configurações</strong> →{" "}
          <strong className="text-ink">Desenvolvedor</strong> →{" "}
          <strong className="text-ink">Aplicativos</strong> e crie um. Você escolhe o nome, e o
          Gravaê cria junto o usuário que vai aparecer nas conversas.
        </p>
        <p>
          Na mesma tela sai o <strong className="text-ink">link de convite</strong>. É por ele
          que alguém com permissão põe o bot num servidor — o bot não entra sozinho, e não
          enxerga servidor onde não foi convidado.
        </p>
      </Secao>

      <Secao id="token" titulo="O token">
        <p>
          O token aparece uma vez, na hora em que o aplicativo é criado. Guarde num lugar seguro:
          o Gravaê não mostra de novo. Se você perder, ou se ele vazar, gere outro na mesma tela
          — o antigo morre na hora.
        </p>
        <p>
          Ele vai no cabeçalho <code>Authorization</code>, com o prefixo <code>Bot </code> antes:
        </p>

        <Codigo legenda="cabeçalho">{`Authorization: Bot SEU_TOKEN_AQUI`}</Codigo>

        <p>
          Token no navegador é token público. Ele mora no seu servidor, em variável de ambiente —
          nunca no código do site, nunca num repositório.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores" />
    </>
  );
}
