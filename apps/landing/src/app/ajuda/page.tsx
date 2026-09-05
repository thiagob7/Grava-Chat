import type { Metadata } from "next";
import Link from "next/link";

import { Cabecalho } from "~/components/Cabecalho";
import { Rodape } from "~/components/Rodape";
import { TabelaDeLimites } from "~/components/TabelaDeLimites";

export const metadata: Metadata = {
  title: "Ajuda — Gravaê",
  description:
    "Como criar um servidor, convidar gente, usar chamada e transmissão, e o que fazer com a sua conta.",
};

const APP = "https://gravae-chat.vercel.app";
const REPO = "https://github.com/thiagob7/Grava-Chat";

const ASSUNTOS = [
  { id: "primeiros-passos", titulo: "Primeiros passos" },
  { id: "servidores", titulo: "Servidores e canais" },
  { id: "conversas", titulo: "Conversas" },
  { id: "chamadas", titulo: "Chamadas e transmissão" },
  { id: "conta", titulo: "Sua conta" },
  { id: "limites", titulo: "Limites" },
  { id: "problemas", titulo: "Deu problema" },
];

const Assunto = ({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-24 border-t border-line/70 pt-10">
    <h2 className="text-2xl font-bold">{titulo}</h2>
    <div className="mt-5 space-y-6">{children}</div>
  </section>
);

const Pergunta = ({ pergunta, children }: { pergunta: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-sm font-semibold text-ink">{pergunta}</h3>
    <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-ink-muted">{children}</div>
  </div>
);

export default function Ajuda() {
  return (
    <>
      <Cabecalho />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
        <h1 className="text-4xl font-bold">Ajuda</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          O Gravaê é um lugar para conversar com os seus, por texto e por voz. Esta página
          responde o que mais perguntam. Se o que você procura não está aqui,{" "}
          <a
            href={`${REPO}/issues/new`}
            target="_blank"
            rel="noreferrer"
            className="text-brand transition hover:text-brand-hover"
          >
            pergunte no GitHub
          </a>
          .
        </p>

        <nav className="mt-8 flex flex-wrap gap-2">
          {ASSUNTOS.map((assunto) => (
            <a
              key={assunto.id}
              href={`#${assunto.id}`}
              className="rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-sm text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              {assunto.titulo}
            </a>
          ))}
        </nav>

        <div className="mt-14 space-y-12">
          <Assunto id="primeiros-passos" titulo="Primeiros passos">
            <Pergunta pergunta="Preciso instalar alguma coisa?">
              <p>
                Não. O Gravaê{" "}
                <a href={APP} className="text-brand transition hover:text-brand-hover">
                  abre no navegador
                </a>{" "}
                e funciona inteiro por lá. O{" "}
                <Link href="/baixar" className="text-brand transition hover:text-brand-hover">
                  aplicativo para computador
                </Link>{" "}
                existe para quem quer atalho na barra de tarefas, avisos do sistema e
                transmissão de tela com o som do computador junto.
              </p>
            </Pergunta>

            <Pergunta pergunta="Quanto custa?">
              <p>
                Nada. Não tem plano pago, não tem anúncio e o que você fala não é vendido para
                ninguém. O código é aberto — dá para ler o que ele faz com os seus dados.
              </p>
            </Pergunta>

            <Pergunta pergunta="Como entro num servidor?">
              <p>
                Por um link de convite que alguém de dentro te manda. Abra o link estando logado
                e você entra direto. Não existe busca pública de servidores: se ninguém te
                convidou, você não vê.
              </p>
            </Pergunta>
          </Assunto>

          <Assunto id="servidores" titulo="Servidores e canais">
            <Pergunta pergunta="Como crio um servidor?">
              <p>
                No trilho da esquerda, o botão de <strong className="text-ink">+</strong> embaixo
                da lista de servidores — o de "Criar ou entrar num servidor". Você dá um nome e uma imagem, e ele nasce com um canal de texto e um de
                voz. Quem cria é o dono, e o dono pode tudo.
              </p>
            </Pergunta>

            <Pergunta pergunta="Como convido gente?">
              <p>
                No nome do servidor, em <strong className="text-ink">Convidar pessoas</strong>. O
                link pode durar 30 minutos, algumas horas, 1 dia, 7 dias ou nunca expirar, e você
                pode limitar quantas pessoas ele aceita. Um link que expirou some sozinho — quem
                tentar usar depois não entra.
              </p>
            </Pergunta>

            <Pergunta pergunta="Que tipos de canal existem?">
              <p>
                <strong className="text-ink">Texto</strong> para conversa,{" "}
                <strong className="text-ink">voz</strong> para chamada e{" "}
                <strong className="text-ink">fórum</strong> para assuntos que rendem — no fórum
                cada assunto vira um post com a sua própria conversa, em vez de tudo se misturar.
              </p>
            </Pergunta>

            <Pergunta pergunta="Como controlo quem faz o quê?">
              <p>
                Por cargos. Cada cargo carrega um conjunto de permissões — ver o canal, mandar
                mensagem, anexar arquivo, entrar na chamada, transmitir, expulsar, banir — e cada
                canal pode passar por cima do que o cargo diz. Um canal pode ser visível só para
                um cargo, ou de leitura para todo mundo e escrita só para a moderação.
              </p>
            </Pergunta>

            <Pergunta pergunta="A conversa está rápida demais. Dá para segurar?">
              <p>
                Dá: o <strong className="text-ink">modo lento</strong> obriga a esperar entre uma
                mensagem e outra, de 5 segundos a 6 horas. Quem tem a permissão de moderar passa
                por cima dele.
              </p>
            </Pergunta>
          </Assunto>

          <Assunto id="conversas" titulo="Conversas">
            <Pergunta pergunta="Dá para editar ou apagar o que eu mandei?">
              <p>
                Dá, a qualquer momento. Mensagem editada ganha um{" "}
                <strong className="text-ink">(editado)</strong> do lado — não dá para mudar o que
                você disse sem que apareça. Quem tem permissão de moderar também pode apagar
                mensagem dos outros.
              </p>
            </Pergunta>

            <Pergunta pergunta="Como faço uma enquete?">
              <p>
                No <strong className="text-ink">+</strong> ao lado da caixa de texto, em{" "}
                <strong className="text-ink">Criar enquete</strong>. Você escreve a pergunta e até
                cinco opções, e escolhe se cada pessoa pode votar em uma ou em várias. O resultado
                aparece na hora para todo mundo.
              </p>
            </Pergunta>

            <Pergunta pergunta="Emojis, figurinhas e sons do servidor">
              <p>
                Todo servidor pode ter os seus. Emoji entra no meio da frase e nas reações,
                figurinha é a mensagem inteira, e som toca para quem está na chamada. Sobem nas
                configurações do servidor, por quem tem a permissão de gerenciar expressões.
              </p>
            </Pergunta>

            <Pergunta pergunta="Como marco uma mensagem importante?">
              <p>
                Fixando. A mensagem fixada fica numa lista no topo do canal, e qualquer um do
                canal consegue voltar nela depois.
              </p>
            </Pergunta>
          </Assunto>

          <Assunto id="chamadas" titulo="Chamadas e transmissão">
            <Pergunta pergunta="Como entro numa chamada?">
              <p>
                Clicando no canal de voz. Não toca para ninguém e não avisa: você entra, e quem
                já estava vê que você chegou. Para sair, o botão de desligar na barra de baixo.
              </p>
            </Pergunta>

            <Pergunta pergunta="Como transmito a minha tela?">
              <p>
                Dentro da chamada, no botão de transmitir. Você escolhe uma janela inteira ou só
                um aplicativo. Quem está na chamada vê um aviso de que você começou, e pode
                assistir clicando no seu quadro.
              </p>
            </Pergunta>

            <Pergunta pergunta="Estou transmitindo mas ninguém ouve o som do jogo">
              <p>
                Levar o som do computador junto com a imagem é coisa do{" "}
                <Link href="/baixar" className="text-brand transition hover:text-brand-hover">
                  aplicativo para computador
                </Link>
                . No navegador, o que dá para mandar depende do navegador — o Chrome consegue com
                o som de uma aba, e nada além disso. Se o som importa, use o aplicativo.
              </p>
            </Pergunta>

            <Pergunta pergunta="O microfone não pega">
              <p>
                Primeiro o navegador: ele precisa ter recebido permissão de microfone para o
                endereço do Gravaê. Depois, em Configurações → Voz, confira se o dispositivo
                escolhido é o certo — a barrinha de teste mostra na hora se ele está captando.
              </p>
            </Pergunta>
          </Assunto>

          <Assunto id="conta" titulo="Sua conta">
            <Pergunta pergunta="Onde vejo onde a minha conta está conectada?">
              <p>
                Em Configurações, na lista de sessões. Cada aparelho que entrou aparece ali, e dá
                para derrubar qualquer um deles — útil se você entrou num computador que não é
                seu e esqueceu de sair.
              </p>
            </Pergunta>

            <Pergunta pergunta="Posso levar os meus dados embora?">
              <p>
                Pode, sem pedir para ninguém. Em Configurações tem a exportação: sai um arquivo
                com o seu perfil, os servidores em que você está, as suas amizades e as suas
                mensagens.
              </p>
            </Pergunta>

            <Pergunta pergunta="E um aplicativo que eu autorizei?">
              <p>
                A lista de aplicativos autorizados fica em Configurações, e tirar a autorização é
                um clique. O aplicativo perde o acesso na hora.
              </p>
            </Pergunta>

            <Pergunta pergunta="Como apago a minha conta?">
              <p>
                Em Configurações, na exclusão da conta. Ela não some na hora: fica{" "}
                <strong className="text-ink">15 dias</strong> marcada para excluir, e voltar a
                entrar nesse prazo cancela tudo. Passados os 15 dias, aí vai.
              </p>
              <p>
                Se você é dono de um servidor com outras pessoas dentro, o Gravaê não deixa
                excluir antes de você passar a posse ou apagar o servidor — para o lugar não ficar
                sem dono de uma hora para outra.
              </p>
            </Pergunta>
          </Assunto>

          <Assunto id="limites" titulo="Limites">
            <p className="text-sm leading-relaxed text-ink-muted">
              Os números valem para todo mundo, e são lidos do próprio código do Gravaê — o que
              está aqui é o que o servidor aceita hoje.
            </p>

            <TabelaDeLimites />
          </Assunto>

          <Assunto id="problemas" titulo="Deu problema">
            <Pergunta pergunta="O Gravaê não carrega">
              <p>
                Veja o{" "}
                <Link href="/status" className="text-brand transition hover:text-brand-hover">
                  status da plataforma
                </Link>
                : ele diz se o problema é nosso e há quanto tempo. A página de status é medida por
                fora, então ela continua honesta mesmo quando o resto não responde.
              </p>
            </Pergunta>

            <Pergunta pergunta="Achei um bug, ou queria pedir alguma coisa">
              <p>
                <a
                  href={`${REPO}/issues/new`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand transition hover:text-brand-hover"
                >
                  Abra uma issue
                </a>
                . Conte o que você fez, o que aconteceu e o que você esperava — com isso dá para
                consertar; sem isso, quase nunca.
              </p>
            </Pergunta>

            <Pergunta pergunta="Quero escrever um bot">
              <p>
                Tem página só para isso:{" "}
                <Link
                  href="/desenvolvedores"
                  className="text-brand transition hover:text-brand-hover"
                >
                  documentação para desenvolvedores
                </Link>
                .
              </p>
            </Pergunta>
          </Assunto>
        </div>
      </main>

      <Rodape />
    </>
  );
}
