import type { Metadata } from "next";

import { Ahead, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { REPO } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Comunidade — Documentação do Gravaê",
  description: "Exemplos que rodam, ferramentas e onde pedir ajuda quando algo não fecha.",
};

const EXAMPLES = [
  {
    folder: "exemplos/bot",
    title: "Esqueleto",
    summary: "O menor bot que responde: conecta, escuta e devolve !ping. Um arquivo.",
  },
  {
    folder: "exemplos/bot-musica",
    title: "Bot de música",
    summary:
      "Toca do YouTube num canal de voz, lendo a configuração de um painel externo antes de cada comando.",
  },
  {
    folder: "exemplos/painel",
    title: "Painel externo",
    summary:
      "Capa, login pelo nosso OAuth2, escolha do servidor e tela de configuração. É o modelo de quem hospeda o próprio site do bot.",
  },
];

export default function Community() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Guias" page="Comunidade" />
        <Title call="Código que roda vale mais que documentação que descreve. Comece por um destes.">
          Comunidade
        </Title>
      </header>

      <Section id="exemplos" title="Exemplos que rodam">
        <p>
          Estão no repositório, em <code>exemplos/</code>. Cada um tem um{" "}
          <code>README</code> com o que precisa de variável de ambiente e como
          subir.
        </p>

        <div className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line">
          {EXAMPLES.map((example) => (
            <div key={example.folder} className="bg-surface-1 px-4 py-3.5">
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold text-ink">{example.title}</span>
                <code className="text-xs text-ink-faint">{example.folder}</code>
              </p>
              <p className="mt-1 text-sm text-ink-muted">{example.summary}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="portal" title="A divisão que confunde no começo">
        <p>
          O <strong>portal</strong> é nosso, e fica dentro do app, em
          Configurações → Aplicativos: é onde o bot nasce, ganha token, avatar,
          descrição e link de convite.
        </p>

        <p>
          O <strong>painel</strong> é seu, e fica onde você hospedar: é onde o
          dono de cada servidor configura o que o seu bot faz. Prefixo, fila
          máxima, boas-vindas — nada disso existe para nós. Nós entregamos o
          OAuth2 e a API; o resto é invenção sua.
        </p>
      </Section>

      <Section id="maquina" title="Se você usa um assistente de código">
        <p>
          Publicamos um índice em texto puro em <code>/llms.txt</code>, com todas
          as páginas, as rotas, os eventos e os motivos de falha. Ele sai do mesmo
          gerador que a documentação, então não diverge dela.
        </p>
      </Section>

      <Section id="ajuda" title="Quando algo não fecha">
        <p>
          Abra um chamado no repositório, em{" "}
          <a href={REPO} className="text-brand hover:underline">
            {REPO.replace("https://", "")}
          </a>
          . Diga o que você chamou, o que voltou e o horário — com horário dá para
          achar o pedido do outro lado.
        </p>
      </Section>

      <Ahead href="/desenvolvedores/referencia" />
    </article>
  );
}
