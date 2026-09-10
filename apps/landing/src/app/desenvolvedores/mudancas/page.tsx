import type { Metadata } from "next";

import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";

export const metadata: Metadata = {
  title: "Registro de mudanças — Documentação do Gravaê",
  description: "O que mudou na API de bots, com data, e o que isso quebra do lado de quem integra.",
};

type Entrada = {
  data: string;
  titulo: string;
  itens: { tipo: "novo" | "mudou" | "quebra"; texto: string }[];
};

/*
  Escrito à mão de propósito, ao contrário do resto da referência. O gerador
  sabe o que a API tem HOJE; só uma pessoa sabe o que mudou e o que isso quebra
  para quem já integrou.
*/
const MUDANCAS: Entrada[] = [
  {
    data: "9 de setembro de 2026",
    titulo: "Solicitações de mensagens",
    itens: [
      {
        tipo: "novo",
        texto:
          "Evento dm:pedido, avisando que uma solicitação de mensagem entrou, saiu ou mudou de estado.",
      },
      {
        tipo: "novo",
        texto:
          "Motivo de falha nao-entregue: a pessoa não recebe mensagem de quem não é amigo.",
      },
      {
        tipo: "novo",
        texto: "Evento event:updated, quando a agenda de eventos do servidor muda.",
      },
    ],
  },
  {
    data: "8 de setembro de 2026",
    titulo: "Voz e mensagem de voz",
    itens: [
      { tipo: "novo", texto: "Canal de voz ganhou status, escrito por quem está na sala." },
      { tipo: "novo", texto: "Mensagem de voz: anexo de áudio gravado no próprio app." },
      {
        tipo: "mudou",
        texto:
          "A mensagem que não saiu passou a dizer por quê, com o motivo no evento de erro.",
      },
    ],
  },
  {
    data: "5 de setembro de 2026",
    titulo: "O bot alcança o servidor inteiro",
    itens: [
      { tipo: "novo", texto: "Membros, cargos e moderação: castigo, banimento e expulsão." },
      { tipo: "novo", texto: "Criar, editar e apagar canal, e criar convite." },
      { tipo: "novo", texto: "Ler o histórico do canal, e não só escrever nele." },
      { tipo: "novo", texto: "Emojis, webhooks e leitura da auditoria." },
    ],
  },
  {
    data: "25 de agosto de 2026",
    titulo: "Bots e OAuth2",
    itens: [
      { tipo: "novo", texto: "Criação de bot, token, link de convite e permissões pedidas." },
      {
        tipo: "novo",
        texto:
          "OAuth2 completo: tela de autorização, troca de código por token, e as rotas de usuário e servidores.",
      },
      {
        tipo: "novo",
        texto: "O gateway passou a aceitar Bot <token> além do JWT de sessão.",
      },
    ],
  },
];

const CORES = {
  novo: "text-online",
  mudou: "text-amber-400",
  quebra: "text-red-400",
} as const;

const ROTULOS = { novo: "novo", mudou: "mudou", quebra: "quebra" } as const;

export default function Mudancas() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Referência" pagina="Mudanças" />
        <Titulo chamada="O que mudou na API, em ordem inversa. Nada some sem aviso, e o que quebra vem marcado.">
          Registro de mudanças
        </Titulo>
      </header>

      <Secao id="promessa" titulo="A promessa">
        <p>
          Campo e evento só são <strong>acrescentados</strong>. Quando algo
          precisar sair, ele aparece aqui marcado como quebra antes de sair, e
          continua funcionando por pelo menos um mês.
        </p>

        <Aviso>
          <strong>Ignore campo que você não conhece.</strong> Um objeto pode ganhar
          campo novo a qualquer momento, e isso não é quebra. Cliente que estoura
          ao ver campo desconhecido vai estourar cedo ou tarde.
        </Aviso>
      </Secao>

      <Secao id="historico" titulo="Histórico">
        <div className="space-y-8">
          {MUDANCAS.map((entrada) => (
            <div key={entrada.data}>
              <p className="text-xs uppercase tracking-wide text-ink-faint">{entrada.data}</p>
              <h3 className="mb-2.5 mt-0.5 text-base font-semibold text-ink">{entrada.titulo}</h3>

              <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
                {entrada.itens.map((item) => (
                  <div
                    key={item.texto}
                    className="flex flex-col gap-x-3 gap-y-1 bg-surface-1 px-4 py-3 sm:flex-row"
                  >
                    <span
                      className={`shrink-0 font-mono text-xs font-bold uppercase sm:w-16 ${CORES[item.tipo]}`}
                    >
                      {ROTULOS[item.tipo]}
                    </span>
                    <p className="text-sm text-ink-muted">{item.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Secao>

      <Adiante href="/desenvolvedores/referencia" />
    </article>
  );
}
