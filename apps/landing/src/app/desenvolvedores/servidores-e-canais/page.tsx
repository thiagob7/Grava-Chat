import type { Metadata } from "next";

import { Adiante, Aviso, Secao, Titulo, Trilha } from "~/components/docs/PecasDosDocs";
import { Codigo } from "~/components/docs/Codigo";
import { API } from "~/dados/docs";

export const metadata: Metadata = {
  title: "Servidores e canais — Documentação do Gravaê",
  description:
    "O que um bot pode mudar num servidor, qual permissão cada coisa exige e o que ele nunca vai conseguir.",
};

const EXIGENCIAS: { area: string; permissao: string; oQue: string }[] = [
  { area: "Nome, ícone e descrição do servidor", permissao: "MANAGE_GUILD", oQue: "PATCH no servidor" },
  { area: "Criar, editar e apagar canal", permissao: "MANAGE_CHANNELS", oQue: "as três rotas de canal" },
  { area: "Criar, editar, apagar e reordenar cargo", permissao: "MANAGE_ROLES", oQue: "as quatro rotas de cargo" },
  { area: "Dar e tirar cargo de alguém", permissao: "MANAGE_ROLES", oQue: "PUT nos cargos do membro" },
  { area: "Trocar apelido de outra pessoa", permissao: "MANAGE_NICKNAMES", oQue: "PATCH no apelido" },
  { area: "Expulsar", permissao: "KICK_MEMBERS", oQue: "DELETE no membro" },
  { area: "Banir e desbanir", permissao: "BAN_MEMBERS", oQue: "as rotas de banimento" },
  { area: "Deixar de castigo", permissao: "MODERATE_MEMBERS", oQue: "PUT no castigo" },
  { area: "Emojis e figurinhas", permissao: "MANAGE_EXPRESSIONS", oQue: "as rotas de emoji" },
  { area: "Webhooks", permissao: "MANAGE_WEBHOOKS", oQue: "listar e criar" },
  { area: "Criar convite", permissao: "CREATE_INVITE", oQue: "POST no convite" },
  { area: "Ler a auditoria", permissao: "VIEW_AUDIT_LOG", oQue: "GET na auditoria" },
];

export default function ServidoresECanais() {
  return (
    <article className="space-y-10">
      <header>
        <Trilha grupo="Guias" pagina="Servidores e canais" />
        <Titulo chamada="Um bot não tem poder próprio: ele tem o cargo que o dono do servidor deu. Esta página diz o que cada coisa exige.">
          Servidores e canais
        </Titulo>
      </header>

      <Secao id="modelo" titulo="O bot é um membro">
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
      </Secao>

      <Secao id="exigencias" titulo="O que cada coisa exige">
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
              {EXIGENCIAS.map((linha) => (
                <tr key={linha.area} className="border-t border-line bg-surface-1">
                  <td className="px-4 py-2.5 text-ink">{linha.area}</td>
                  <td className="px-4 py-2.5">
                    <code className="text-[13px]">{linha.permissao}</code>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{linha.oQue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao id="hierarquia" titulo="A hierarquia manda mais que a permissão">
        <p>
          Ter <code>MANAGE_ROLES</code> não basta. O bot só mexe em cargo abaixo
          do mais alto que ele tem, e só modera quem está abaixo dele. Um bot com
          todas as permissões e cargo no fim da lista não bane ninguém.
        </p>

        <Aviso>
          <strong>É o erro mais comum de quem instala um bot.</strong> A pessoa dá
          todas as permissões, o bot continua respondendo &ldquo;sem
          permissão&rdquo;, e ninguém entende. A resposta quase sempre é arrastar
          o cargo do bot para cima.
        </Aviso>
      </Secao>

      <Secao id="canais" titulo="Canais">
        <p>
          Três tipos: <code>TEXT</code>, <code>VOICE</code> e <code>FORUM</code>.
          O bot enxerga só os canais que o cargo dele alcança — a listagem já vem
          filtrada, e não existe jeito de ver o que está escondido.
        </p>

        <Codigo>{`curl -X POST ${API}/bot/servidores/SEU_SERVIDOR/canais \\
  -H "Authorization: Bot SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "name": "avisos-do-bot", "type": "TEXT" }'`}</Codigo>

        <p>
          Permissão por canal existe e vence a do servidor naquele canal. Um bot
          com <code>MANAGE_CHANNELS</code> no servidor mas negado num canal
          específico não mexe nesse canal.
        </p>
      </Secao>

      <Secao id="auditoria" titulo="Tudo fica registrado">
        <p>
          Ação de bot entra na auditoria igual à de gente, com o nome dele. Quem
          administra o servidor vê o que o seu bot fez, quando, e em quem. Vale
          contar isso na descrição do bot: transparência aqui evita desinstalação
          depois.
        </p>
      </Secao>

      <Adiante href="/desenvolvedores/referencia/servidor" />
    </article>
  );
}
