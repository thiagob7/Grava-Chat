import type { Metadata } from "next";

import { Ahead, Cards, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import reference from "~/dados/referencia.json";

export const metadata: Metadata = {
  title: "Introdução — Documentação do Gravaê",
  description: "O que dá pra construir no Gravaê e por onde começar.",
};

const BUILD = [
  {
    href: "/desenvolvedores/primeiro-bot",
    title: "Bots",
    text:
      "Um usuário que o seu código controla: manda mensagem, reage, entra em servidor e responde a comando de barra.",
  },
  {
    href: "/desenvolvedores/tempo-real",
    title: "Integrações",
    text:
      "Uma conexão que fica aberta ouvindo o que acontece e leva para fora — ou traz de fora para dentro.",
  },
  {
    href: "/desenvolvedores/comandos",
    title: "Comandos de barra",
    text:
      "O jeito de dar uma ação nova a quem usa o servidor, com nome, descrição e opções, aparecendo na caixa de texto.",
  },
  {
    href: "/desenvolvedores/referencia",
    title: "Automações",
    text:
      "Nem tudo precisa ficar de pé: um script que roda de hora em hora só chama o REST e vai embora.",
  },
];

export default function Intro() {
  const routes = reference.rest.length;
  const events = reference.events.length + reference.received.length;
  const permissions = reference.permissions.reduce((total, g) => total + g.items.length, 0);

  return (
    <article className="space-y-10">
      <header>
        <Trail group="Bem-vindo" page="Introdução" />
        <Title call="Construa bots, comandos e integrações no Gravaê — o mesmo servidor que atende o aplicativo atende o seu código.">
          Plataforma de desenvolvimento do Gravaê
        </Title>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {[
          { number: routes, label: "rotas REST" },
          { number: events, label: "eventos" },
          { number: permissions, label: "permissões" },
        ].map((piece) => (
          <div
            key={piece.label}
            className="rounded-xl border border-line bg-surface-1 px-4 py-3.5 text-center"
          >
            <p className="text-2xl font-bold text-ink">{piece.number}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{piece.label}</p>
          </div>
        ))}
      </div>

      <Section id="construir" title="O que você quer construir?">
        <Cards items={BUILD} />
      </Section>

      <Section id="como-funciona" title="Como funciona">
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
      </Section>

      <Section id="de-onde-vem" title="De onde vem esta documentação">
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
      </Section>

      <Ahead href="/desenvolvedores" />
    </article>
  );
}
