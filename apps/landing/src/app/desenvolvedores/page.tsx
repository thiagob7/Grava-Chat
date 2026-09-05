import type { Metadata } from "next";

import { Cabecalho } from "~/components/Cabecalho";
import { Codigo } from "~/components/Codigo";
import { EventosEnviados, EventosRecebidos, RotasRest } from "~/components/ReferenciaDaApi";
import { Rodape } from "~/components/Rodape";

export const metadata: Metadata = {
  title: "Desenvolvedores — Gravaê",
  description: "Como construir um bot no Gravaê: token, REST, tempo real e comandos de barra.",
};

const API = "https://gravaechat-api.duckdns.org/api";

const SECOES = [
  { id: "comecar", titulo: "Comece por aqui" },
  { id: "token", titulo: "O token" },
  { id: "primeira-mensagem", titulo: "A primeira mensagem" },
  { id: "tempo-real", titulo: "Ficar ouvindo" },
  { id: "comandos", titulo: "Comandos de barra" },
  { id: "rest", titulo: "Referência: REST" },
  { id: "enviados", titulo: "Referência: o que o bot envia" },
  { id: "recebidos", titulo: "Referência: o que o bot recebe" },
  { id: "limites", titulo: "Limites" },
];

const Secao = ({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-24 border-t border-line/70 pt-12">
    <h2 className="text-2xl font-bold">{titulo}</h2>
    <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-muted">{children}</div>
  </section>
);

export default function Desenvolvedores() {
  return (
    <>
      <Cabecalho />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Desenvolvedores
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Construa no Gravaê</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">
            Um bot do Gravaê é um usuário como qualquer outro: entra em servidores, lê canais,
            manda mensagem, reage e responde a comandos de barra. A diferença é que ele se
            identifica com um token em vez de uma sessão, e por isso não precisa ficar com uma
            janela aberta.
          </p>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Tudo o que está nesta página sai do próprio código da API — as rotas lidas do
            servidor, os campos de cada evento convertidos dos contratos. Se um campo aparece
            aqui, ele existe lá.
          </p>
        </div>

        <div className="mt-16 flex gap-12">
          <nav className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 space-y-1">
              {SECOES.map((secao) => (
                <a
                  key={secao.id}
                  href={`#${secao.id}`}
                  className="block rounded-md px-3 py-1.5 text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                >
                  {secao.titulo}
                </a>
              ))}
            </div>
          </nav>

          <div className="min-w-0 flex-1 space-y-12">
            <Secao id="comecar" titulo="Comece por aqui">
              <p>
                Abra o Gravaê, vá em <strong className="text-ink">Configurações</strong> →{" "}
                <strong className="text-ink">Desenvolvedor</strong> →{" "}
                <strong className="text-ink">Aplicativos</strong> e crie um aplicativo. Você
                escolhe o nome, e o Gravaê cria junto o usuário que vai aparecer nas conversas.
              </p>
              <p>
                Na mesma tela sai o <strong className="text-ink">link de convite</strong>. É por
                ele que alguém com permissão põe o bot num servidor — o bot não entra sozinho, e
                não enxerga servidor onde não foi convidado.
              </p>
            </Secao>

            <Secao id="token" titulo="O token">
              <p>
                O token aparece uma vez, na hora em que o aplicativo é criado. Guarde num lugar
                seguro: o Gravaê não mostra de novo. Se você perder, ou se ele vazar, gere outro
                na mesma tela — o antigo morre na hora.
              </p>
              <p>
                Ele vai no cabeçalho <code>Authorization</code>, com o prefixo{" "}
                <code>Bot </code> antes:
              </p>

              <Codigo legenda="cabeçalho">{`Authorization: Bot SEU_TOKEN_AQUI`}</Codigo>

              <p>
                Token no navegador é token público. Ele mora no seu servidor, em variável de
                ambiente — nunca no código do site, nunca num repositório.
              </p>
            </Secao>

            <Secao id="primeira-mensagem" titulo="A primeira mensagem">
              <p>Confirme que o token está de pé perguntando quem é o bot:</p>

              <Codigo>{`curl ${API}/bot/eu \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Codigo>

              <p>
                Depois pegue um canal. <code>/bot/servidores</code> lista onde o bot foi
                convidado, e cada servidor tem seus canais:
              </p>

              <Codigo>{`curl ${API}/bot/servidores \\
  -H "Authorization: Bot $GRAVAE_TOKEN"

curl ${API}/bot/servidores/$SERVIDOR/canais \\
  -H "Authorization: Bot $GRAVAE_TOKEN"`}</Codigo>

              <p>E fale:</p>

              <Codigo>{`curl -X POST ${API}/bot/canais/$CANAL/mensagens \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"content":"oi, cheguei"}'`}</Codigo>
            </Secao>

            <Secao id="tempo-real" titulo="Ficar ouvindo">
              <p>
                Pelo REST o bot só fala quando você manda. Para ele reagir ao que acontece, abra
                uma conexão de tempo real — é Socket.IO, e o token vai no{" "}
                <code>auth</code> do aperto de mão, com o mesmo prefixo <code>Bot</code>:
              </p>

              <Codigo legenda="bot.js">{`import { io } from "socket.io-client";

const socket = io("https://gravaechat-api.duckdns.org", {
  transports: ["websocket"],
  auth: { token: \`Bot \${process.env.GRAVAE_TOKEN}\` },
});

socket.on("connect", () => console.log("de pé"));

socket.on("message:created", (msg) => {
  if (msg.content === "!ping") {
    socket.emit("message:send", { channelId: msg.channelId, content: "pong" });
  }
});

socket.on("error", ({ event, message }) => {
  console.error(event, message);
});`}</Codigo>

              <p>
                O bot já entra escutando os servidores onde foi convidado. Para acompanhar um
                canal específico, mande <code>channel:subscribe</code> com o{" "}
                <code>channelId</code>.
              </p>
            </Secao>

            <Secao id="comandos" titulo="Comandos de barra">
              <p>
                Registre a lista de comandos uma vez. O <code>PUT</code> substitui inteira a
                lista anterior — mandar um array vazio apaga todos:
              </p>

              <Codigo>{`curl -X PUT ${API}/bot/comandos \\
  -H "Authorization: Bot $GRAVAE_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"comandos":[{"nome":"clima","descricao":"O tempo agora"}]}'`}</Codigo>

              <p>
                Quando alguém usa o comando, chega <code>command:invoked</code> com o canal, o
                servidor, quem chamou e as opções. Responder é mandar uma mensagem no canal que
                veio no evento.
              </p>
            </Secao>

            <Secao id="rest" titulo="Referência: REST">
              <p>
                Tudo abaixo de <code>{API}</code>, tudo com o cabeçalho{" "}
                <code>Authorization</code>. Rota que mexe em mensagem só aceita mensagem do
                próprio bot.
              </p>

              <RotasRest />
            </Secao>

            <Secao id="enviados" titulo="Referência: o que o bot envia">
              <p>
                Os eventos que a sua conexão pode mandar, com os campos que cada um espera. Campo
                fora do formato volta como <code>error</code>, com o nome do evento junto.
              </p>

              <EventosEnviados />
            </Secao>

            <Secao id="recebidos" titulo="Referência: o que o bot recebe">
              <p>
                O que chega na conexão. Nem todo evento interessa a todo bot — assine o que você
                vai usar e ignore o resto.
              </p>

              <EventosRecebidos />
            </Secao>

            <Secao id="limites" titulo="Limites">
              <p>
                São 300 requisições por minuto por endereço de IP. Estourou, a API responde{" "}
                <code>429</code> dizendo em quantos segundos você pode voltar — respeite o
                número em vez de tentar de novo na hora.
              </p>
              <p>
                O Gravaê roda em duas máquinas pequenas e o código é aberto. Se o seu bot precisa
                de mais fôlego do que isso,{" "}
                <a
                  href="https://github.com/thiagob7/Grava-Chat/issues/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand transition hover:text-brand-hover"
                >
                  abra uma issue
                </a>{" "}
                antes de ligar — dá pra combinar.
              </p>
            </Secao>
          </div>
        </div>
      </main>

      <Rodape />
    </>
  );
}
