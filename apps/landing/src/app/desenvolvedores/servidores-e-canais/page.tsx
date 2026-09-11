import type { Metadata } from "next";

import { Ahead, Notice, Section, Title, Trail } from "~/components/docs/PecasDosDocs";
import { Code } from "~/components/docs/Codigo";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Servidores e canais — Documentação do Gravaê",
  description:
    "O que um bot pode mudar num servidor, qual permissão cada coisa exige e o que ele nunca vai conseguir.",
};

const REQUIREMENTS: { area: string; permission: string; oQue: string }[] = [
  { area: "Nome, ícone e descrição do servidor", permission: "MANAGE_GUILD", oQue: "PATCH no servidor" },
  { area: "Criar, editar e apagar canal", permission: "MANAGE_CHANNELS", oQue: "as três rotas de canal" },
  { area: "Criar, editar, apagar e reordenar cargo", permission: "MANAGE_ROLES", oQue: "as quatro rotas de cargo" },
  { area: "Dar e tirar cargo de alguém", permission: "MANAGE_ROLES", oQue: "PUT nos cargos do membro" },
  { area: "Trocar apelido de outra pessoa", permission: "MANAGE_NICKNAMES", oQue: "PATCH no apelido" },
  { area: "Expulsar", permission: "KICK_MEMBERS", oQue: "DELETE no membro" },
  { area: "Banir e desbanir", permission: "BAN_MEMBERS", oQue: "as rotas de banimento" },
  { area: "Deixar de castigo", permission: "MODERATE_MEMBERS", oQue: "PUT no castigo" },
  { area: "Emojis e figurinhas", permission: "MANAGE_EXPRESSIONS", oQue: "as rotas de emoji" },
  { area: "Webhooks", permission: "MANAGE_WEBHOOKS", oQue: "listar e criar" },
  { area: "Criar convite", permission: "CREATE_INVITE", oQue: "POST no convite" },
  { area: "Ler a auditoria", permission: "VIEW_AUDIT_LOG", oQue: "GET na auditoria" },
];

export default function ServersChannels() {
  return (
    <article className="space-y-10">
      <header>
        <Trail group="Guias" page="Servidores e canais" />
        <Title call="Um bot não tem poder próprio: ele tem o cargo que o dono do servidor deu. Esta página diz o que cada coisa exige.">
          Servidores e canais
        </Title>
      </header>

      <Section id="modelo" title="O bot é um membro">
        <p>
          Aqui o bot não é uma categoria à parte com regras próprias: ele é um
          usuário de verdade, com cargo, permissões e lugar na hierarquia. Isso
          significa que tudo o que você sabe sobre permissão de gente vale igual
          para ele — inclusive o que ele <em>não</em> consegue.
        </p>

        <p>
          Ao entrar num servidor, o bot ganha um cargo próprio com o que pediu no
          link de convite. Bot que não pediu nada entra sem cargo, para não sujar
          a lista de cargos do servidor.
        </p>
      </Section>

      <Section id="exigencias" title="O que cada coisa exige">
        <p>
          Faltando a permissão, a resposta é <code>403</code>. Se o canal estiver
          fora do alcance do bot, a resposta é <code>404</code> — mesmo que ele
          exista.
        </p>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-2 text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Para</th>
                <th className="px-4 py-2.5 font-medium">Precisa de</th>
                <th className="px-4 py-2.5 font-medium">Onde</th>
              </tr>
            </thead>
            <tbody>
              {REQUIREMENTS.map((line) => (
                <tr key={line.area} className="border-t border-line bg-surface-1">
                  <td className="px-4 py-2.5 text-ink">{line.area}</td>
                  <td className="px-4 py-2.5">
                    <code className="text-[13px]">{line.permission}</code>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{line.oQue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="hierarquia" title="A hierarquia manda mais que a permissão">
        <p>
          Ter <code>MANAGE_ROLES</code> não basta. O bot só mexe em cargo abaixo
          do mais alto que ele tem, e só modera quem está abaixo dele. Um bot com
          todas as permissões e cargo no fim da lista não bane ninguém.
        </p>

        <Notice>
          <strong>É o erro mais comum de quem instala um bot.</strong> A pessoa dá
          todas as permissões, o bot continua respondendo &ldquo;sem
          permissão&rdquo;, e ninguém entende. A resposta quase sempre é arrastar
          o cargo do bot para cima.
        </Notice>
      </Section>

      <Section id="canais" title="Canais">
        <p>
          Três tipos: <code>TEXT</code>, <code>VOICE</code> e <code>FORUM</code>.
          O bot enxerga só os canais que o cargo dele alcança — a listagem já vem
          filtrada, e não existe jeito de ver o que está escondido.
        </p>

        <Code>{`curl -X POST ${API}/bot/servidores/SEU_SERVIDOR/canais \\
  -H "Authorization: Bot SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "avisos-do-bot", "type": "TEXT" }'`}</Code>

        <p>
          Permissão por canal existe e vence a do servidor naquele canal. Um bot
          com <code>MANAGE_CHANNELS</code> no servidor mas negado num canal
          específico não mexe nesse canal.
        </p>
      </Section>

      <Section id="auditoria" title="Tudo fica registrado">
        <p>
          Ação de bot entra na auditoria igual à de gente, com o nome dele. Quem
          administra o servidor vê o que o seu bot fez, quando, e em quem. Vale
          contar isso na descrição do bot: transparência aqui evita desinstalação
          depois.
        </p>
      </Section>

      <Ahead href="/desenvolvedores/referencia/servidor" />
    </article>
  );
}
