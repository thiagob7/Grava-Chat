import type { Metadata } from "next";

import { Adiante, Cartoes, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import referencia from "~/dados/referencia.json";

export const metadata: Metadata = {
  title: "Introdução — Documentação do Gravaê",
  description: "O que dá pra construir no Gravaê e por onde começar.",
};

const CONSTRUIR = [
  {
    href: "/desenvolvedores/primeiro-bot",
    titulo: "Bots",
    texto:
      "Um usuário que o seu código controla: manda mensagem, reage, entra em servidor e responde a comando de barra.",
  },
  {
    href: "/desenvolvedores/tempo-real",
    titulo: "Integrações",
    texto:
      "Uma conexão que fica aberta ouvindo o que acontece e leva para fora — ou traz de fora para dentro.",
  },
  {
    href: "/desenvolvedores/comandos",
    titulo: "Comandos de barra",
    texto:
      "O jeito de dar uma ação nova a quem usa o servidor, com nome, descrição e opções, aparecendo na caixa de texto.",
  },
  {
    href: "/desenvolvedores/referencia",
    titulo: "Automações",
    texto:
      "Nem tudo precisa ficar de pé: um script que roda de hora em hora só chama o REST e vai embora.",
  },
];

export default function Introducao() {
  const rotas = referencia.rest.length;
  const eventos = referencia.eventos.length + referencia.recebidos.length;
  const permissoes = referencia.permissoes.reduce((total, g) => total + g.itens.length, 0);

  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Bem-vindo" pagina="Introdução" />
        <Titulo chamada="Construa bots, comandos e integrações no Gravaê — o mesmo servidor que atende o aplicativo atende o seu código.">
          Plataforma de desenvolvimento do Gravaê
        </Titulo>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { numero: rotas, rotulo: "rotas REST" },
          { numero: eventos, rotulo: "eventos" },
          { numero: permissoes, rotulo: "permissões" },
        ].map((peca) => (
          <div
            key={peca.rotulo}
            className="rounded-xl border border-line bg-surface-1 px-4 py-3.5 text-center"
          >
            <p className="text-2xl font-bold text-ink">{peca.numero}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{peca.rotulo}</p>
          </div>
        ))}
      </div>

      <Secao id="construir" titulo="O que você quer construir?">
        <Cartoes itens={CONSTRUIR} />
      </Secao>

      <Secao id="como-funciona" titulo="Como funciona">
        <p>
          Um bot do Gravaê é um usuário como qualquer outro: entra em servidores, lê canais, manda
          mensagem, reage e responde a comandos. A diferença é que ele se identifica com um{" "}
          <strong className="text-ink">token</strong> em vez de uma sessão, e por isso não precisa
          de ninguém com uma janela aberta.
        </p>
        <p>
          Ele fala com o servidor de dois jeitos, e quase todo bot usa os dois. Pelo{" "}
          <strong className="text-ink">REST</strong>, quando quer agir: mandar mensagem, apagar,
          reagir. Pela <strong className="text-ink">conexão de tempo real</strong>, quando quer
          saber: chegou mensagem, chamaram um comando, alguém entrou na chamada.
        </p>
      </Secao>

      <Secao id="de-onde-vem" titulo="De onde vem esta documentação">
        <p>
          Ela sai do próprio código da API. As rotas são lidas do servidor, os campos de cada
          evento vêm dos contratos, as permissões e os limites vêm das constantes que o aplicativo
          usa. Se está escrito aqui, existe lá.
        </p>
        <p>
          E não é só na hora de gerar: rota nova sem descrição, evento novo sem texto ou permissão
          fora de grupo <strong className="text-ink">derrubam o build do site</strong>. É a
          garantia de que esta página não vai envelhecer calada enquanto ninguém olha.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores" />
    </article>
  );
}
