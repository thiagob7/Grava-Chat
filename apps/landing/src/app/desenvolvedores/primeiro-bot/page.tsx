import type { Metadata } from "next";

import { Codigo } from "~/components/docs/Codigo";
import { Adiante, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Seu primeiro bot — Documentação do Gravaê",
  description: "Do token à primeira mensagem em três comandos.",
};

export default function PrimeiroBot() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Guias" pagina="Seu primeiro bot" />
        <Titulo chamada="Com o token na mão e o bot convidado num servidor, a primeira mensagem sai em três comandos. Sem instalar nada.">
          Seu primeiro bot
        </Titulo>
      </header>

      <Secao id="confirmar" titulo="1. Confirme o token">
        <Codigo>{`curl ${API}/bot/eu \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Codigo>

        <p>
          Voltou <code>botId</code> e <code>userId</code>? Está de pé.
        </p>
      </Secao>

      <Secao id="canal" titulo="2. Ache um canal">
        <Codigo>{`curl ${API}/bot/servidores \\
  -H "Authorization: Bot $GRAVAE_TOKEN"

curl ${API}/bot/servidores/$SERVIDOR/canais \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Codigo>

        <p>
          Lista vazia quer dizer que ninguém convidou o bot ainda — volte no link de convite da
          tela de Aplicativos. Os canais vêm com <code>id</code>, <code>name</code> e{" "}
          <code>type</code>; para escrever, você quer um de tipo <code>TEXT</code>.
        </p>
      </Secao>

      <Secao id="falar" titulo="3. Fale">
        <Codigo>{`curl -X POST ${API}/bot/canais/$CANAL/mensagens \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"content":"oi, cheguei"}'`}</Codigo>

        <p>
          A mensagem aparece na hora para quem estiver com o canal aberto — o mesmo caminho de uma
          mensagem de gente. Editar e apagar são <code>PATCH</code> e <code>DELETE</code> em cima
          do <code>id</code> que voltou aqui.
        </p>
      </Secao>

      <Secao id="e-agora" titulo="E agora?">
        <p>
          Isso é o bot falando quando você manda. Para ele reagir sozinho ao que acontece no
          servidor, o próximo passo é a conexão de tempo real.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/primeiro-bot" />
    </article>
  );
}
