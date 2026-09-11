import type { Metadata } from "next";

import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";

export const metadata: Metadata = {
  title: "Registro de mudanças — Documentação do Gravaê",
  description: "O que mudou na API de bots, com data, e o que isso quebra do lado de quem integra.",
};

type Entry = {
  data: string;
  title: string;
  items: { kind: "novo" | "mudou" | "quebra"; text: string }[];
};

/*
  Escrito à mão de propósito, ao contrário do resto da referência. O gerador
  sabe o que a API tem HOJE; só uma pessoa sabe o que mudou e o que isso quebra
  para quem já integrou.
*/
const CHANGES: Entry[] = [
  {
    data: "9 de setembro de 2026",
    title: "Solicitações de mensagens",
    items: [
      {
        kind: "novo",
        text:
          "Evento dm:pedido, avisando que uma solicitação de mensagem entrou, saiu ou mudou de estado.",
      },
      {
        kind: "novo",
        text:
          "Motivo de falha nao-entregue: a pessoa não recebe mensagem de quem não é amigo.",
      },
      {
        kind: "novo",
        text: "Evento event:updated, quando a agenda de eventos do servidor muda.",
      },
    ],
  },
  {
    data: "8 de setembro de 2026",
    title: "Voz e mensagem de voz",
    items: [
      { kind: "novo", text: "Canal de voz ganhou status, escrito por quem está na sala." },
      { kind: "novo", text: "Mensagem de voz: anexo de áudio gravado no próprio app." },
      {
        kind: "mudou",
        text:
          "A mensagem que não saiu passou a dizer por quê, com o motivo no evento de erro.",
      },
    ],
  },
  {
    data: "5 de setembro de 2026",
    title: "O bot alcança o servidor inteiro",
    items: [
      { kind: "novo", text: "Membros, cargos e moderação: castigo, banimento e expulsão." },
      { kind: "novo", text: "Criar, editar e apagar canal, e criar convite." },
      { kind: "novo", text: "Ler o histórico do canal, e não só escrever nele." },
      { kind: "novo", text: "Emojis, webhooks e leitura da auditoria." },
    ],
  },
  {
    data: "25 de agosto de 2026",
    title: "Bots e OAuth2",
    items: [
      { kind: "novo", text: "Criação de bot, token, link de convite e permissões pedidas." },
      {
        kind: "novo",
        text:
          "OAuth2 completo: tela de autorização, troca de código por token, e as rotas de usuário e servidores.",
      },
      {
        kind: "novo",
        text: "O gateway passou a aceitar Bot <token> além do JWT de sessão.",
      },
    ],
  },
];

const COLORS = {
  novo: "text-online",
  mudou: "text-amber-400",
  quebra: "text-red-400",
} as const;

const LABELS = { novo: "novo", mudou: "mudou", quebra: "quebra" } as const;

export default function Changes() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Referência" page="Mudanças" />
        <Title call="O que mudou na API, em ordem inversa. Nada some sem aviso, e o que quebra vem marcado.">
          Registro de mudanças
        </Title>
      </header>

      <Section id="promessa" title="A promessa">
        <p>
          Campo e evento só são <strong>acrescentados</strong>. Quando algo
          precisar sair, ele aparece aqui marcado como quebra antes de sair, e
          continua funcionando por pelo menos um mês.
        </p>

        <Notice>
          <strong>Ignore campo que você não conhece.</strong> Um objeto pode ganhar
          campo novo a qualquer momento, e isso não é quebra. Cliente que estoura
          ao ver campo desconhecido vai estourar cedo ou tarde.
        </Notice>
      </Section>

      <Section id="historico" title="Histórico">
        <div className="space-y-8">
          {CHANGES.map((entry) => (
            <div key={entry.data}>
              <p className="text-xs uppercase tracking-wide text-ink-faint">{entry.data}</p>
              <h3 className="mb-2.5 mt-0.5 text-base font-semibold text-ink">{entry.title}</h3>

              <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
                {entry.items.map((item) => (
                  <div
                    key={item.text}
                    className="flex flex-col gap-x-3 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
                  >
                    <span
                      className={`shrink-0 font-mono text-xs font-bold uppercase sm:w-16 ${COLORS[item.kind]}`}
                    >
                      {LABELS[item.kind]}
                    </span>
                    <p className="text-sm text-ink-muted">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Ahead href="/desenvolvedores/referencia" />
    </article>
  );
}
