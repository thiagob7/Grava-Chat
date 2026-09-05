import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";
import {
  clientEventSchemas,
  DEFAULT_EVERYONE_PERMISSIONS,
  LIMITS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from "@gravae/shared";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ROTAS = join(AQUI, "..", "..", "api", "src", "routes", "bot-api.ts");
const EVENTOS = join(AQUI, "..", "..", "..", "packages", "shared", "src", "events.ts");
const SAIDA = join(AQUI, "..", "src", "dados", "referencia.json");

const DESCRICOES = {
  "GET /bot/eu": "Quem é o bot deste token.",
  "GET /bot/servidores": "Os servidores em que o bot está.",
  "GET /bot/servidores/:guildId/canais": "Os canais de um servidor, com o que o bot alcança.",
  "GET /bot/servidores/:guildId/membros": "Quem está no servidor, com apelido, cargos e desde quando.",
  "GET /bot/servidores/:guildId/cargos": "Os cargos do servidor, com as permissões de cada um.",
  "PATCH /bot/servidores/:guildId/membros/:userId/apelido":
    "Troca o apelido de alguém no servidor. `null` devolve o nome de origem.",
  "PUT /bot/servidores/:guildId/membros/:userId/cargos":
    "Define os cargos do membro. Substitui a lista inteira, e o bot não alcança cargo acima do dele.",
  "DELETE /bot/servidores/:guildId/membros/:userId": "Expulsa. Quem foi expulso volta com convite novo.",
  "PUT /bot/servidores/:guildId/castigos/:userId":
    "Castiga por N minutos: a pessoa fica sem escrever nem falar. `minutos: 0` solta na hora.",
  "GET /bot/servidores/:guildId/banimentos": "Quem está banido, e por quê.",
  "PUT /bot/servidores/:guildId/banimentos/:userId":
    "Bane. `apagarHoras` apaga junto o que a pessoa escreveu nas últimas N horas.",
  "DELETE /bot/servidores/:guildId/banimentos/:userId": "Desbane, devolvendo o acesso na hora.",
  "POST /bot/servidores/:guildId/canais": "Cria um canal de texto, voz ou fórum.",
  "PATCH /bot/servidores/:guildId/canais/:channelId":
    "Muda nome, tópico, categoria, posição ou modo lento do canal.",
  "DELETE /bot/servidores/:guildId/canais/:channelId":
    "Apaga o canal, e com ele todas as mensagens. Não tem como desfazer.",
  "POST /bot/servidores/:guildId/convites": "Cria um link de convite pro servidor.",
  "PUT /bot/comandos": "Registra a lista de comandos de barra do bot. Substitui a anterior.",
  "POST /bot/canais/:channelId/mensagens": "Manda uma mensagem no canal.",
  "GET /bot/canais/:channelId/mensagens":
    "Lê o histórico do canal, do mais novo pro mais velho. `limit` até 100, `before` pra paginar.",
  "GET /bot/canais/:channelId/fixadas": "As mensagens fixadas do canal.",
  "PUT /bot/mensagens/:messageId/fixar": "Fixa a mensagem no canal.",
  "DELETE /bot/mensagens/:messageId/fixar": "Desafixa a mensagem.",
  "PATCH /bot/mensagens/:messageId": "Edita uma mensagem do próprio bot.",
  "DELETE /bot/mensagens/:messageId": "Apaga uma mensagem do próprio bot.",
  "PUT /bot/mensagens/:messageId/reacoes/:emoji": "Reage a uma mensagem.",
  "DELETE /bot/mensagens/:messageId/reacoes/:emoji": "Tira a reação do bot.",
};

const RECEBIDOS = {
  "message:created": "Mensagem nova num canal que o bot acompanha.",
  "message:updated": "Mensagem editada.",
  "message:deleted": "Mensagem apagada.",
  "message:reactions": "A lista de reações da mensagem inteira, já recontada.",
  "message:super": "Alguém mandou a reação em destaque.",
  "typing:started": "Alguém começou a digitar no canal.",
  "command:invoked": "Chamaram um comando de barra do bot. É por aqui que ele trabalha.",
  "commands:changed": "A lista de comandos do servidor mudou.",
  "presence:changed": "Alguém ficou on-line, ausente ou saiu.",
  "presence:self": "O estado que o servidor guardou para esta conexão.",
  "user:updated": "Perfil ou apelido de alguém mudou.",
  "friend:updated": "Algo mudou na lista de amizades.",
  "dm:created": "Abriram uma conversa direta.",
  "member:joined": "Entrou gente no servidor.",
  "member:updated": "Cargo ou apelido de um membro mudou.",
  "member:left": "Saiu gente do servidor.",
  "channel:created": "Canal novo.",
  "channel:updated": "Canal renomeado ou remexido.",
  "channel:deleted": "Canal apagado.",
  "guild:refresh": "Recarregue o servidor: mudou coisa demais pra avisar campo a campo.",
  "post:created": "Post novo no fórum.",
  "post:updated": "Post do fórum editado.",
  "expressions:changed": "Os emojis ou figurinhas do servidor mudaram.",
  "guild:deleted": "O servidor foi apagado.",
  "guild:updated": "Nome, ícone ou descrição do servidor mudou.",
  "voice:states": "O retrato completo de quem está na chamada do canal.",
  "voice:sound": "Alguém tocou um som na chamada.",
  "voice:move": "Arrastaram esta conexão para outro canal de voz.",
  "voice:joined": "Alguém entrou na chamada.",
  "voice:left": "Alguém saiu da chamada.",
  "voice:updated": "Mudou o microfone, o fone ou a transmissão de alguém.",
  "voice:recusada": "A entrada na chamada foi recusada.",
  "live:started": "Começou uma transmissão de tela.",
  "live:ended": "A transmissão de tela acabou.",
  error: "Deu errado o que o bot pediu. Vem com o nome do evento e o motivo.",
};

const CORPOS = {
  "POST /bot/servidores/:guildId/canais": "createChannelInput — name, type (TEXT | VOICE | FORUM)",
  "PATCH /bot/servidores/:guildId/canais/:channelId": "updateChannelInput — tudo opcional",
  "POST /bot/servidores/:guildId/convites": "{ maxUses?: number, expiresInHours?: number }",
  "PATCH /bot/servidores/:guildId/membros/:userId/apelido": "{ nickname: string | null }",
  "PUT /bot/servidores/:guildId/membros/:userId/cargos": "{ roleIds: string[] }",
  "PUT /bot/servidores/:guildId/castigos/:userId": "{ minutos: number, reason?: string }",
  "PUT /bot/servidores/:guildId/banimentos/:userId": "{ reason?: string, apagarHoras?: number }",
  "PUT /bot/comandos": "definirComandosInput",
  "POST /bot/canais/:channelId/mensagens": "sendMessageInput sem channelId e nonce",
  "PATCH /bot/mensagens/:messageId": "editMessageInput sem messageId",
  "PUT /bot/mensagens/:messageId/reacoes/:emoji": "{ burst?: boolean }",
};

const LIMITES = [
  { chave: "messageLength", rotulo: "Tamanho de uma mensagem", formato: "caracteres" },
  { chave: "attachmentsPerMessage", rotulo: "Anexos por mensagem", formato: "numero" },
  { chave: "attachmentBytes", rotulo: "Tamanho de cada anexo", formato: "bytes" },
  { chave: "avatarBytes", rotulo: "Tamanho da foto de perfil", formato: "bytes" },
  { chave: "bannerBytes", rotulo: "Tamanho do banner", formato: "bytes" },
  { chave: "bio", rotulo: "Sobre mim", formato: "caracteres" },
  { chave: "statusPersonalizado", rotulo: "Recado do perfil", formato: "caracteres" },
  { chave: "emojisPorServidor", rotulo: "Emojis por servidor", formato: "numero" },
  { chave: "figurinhasPorServidor", rotulo: "Figurinhas por servidor", formato: "numero" },
  { chave: "sonsPorServidor", rotulo: "Sons por servidor", formato: "numero" },
  { chave: "opcoesPorEnquete", rotulo: "Opções por enquete", formato: "numero" },
  { chave: "mensagensFixadas", rotulo: "Mensagens fixadas por canal", formato: "numero" },
  { chave: "modoLentoMax", rotulo: "Modo lento, no máximo", formato: "segundos" },
] as const;

const sumido = LIMITES.filter(({ chave }) => !(chave in LIMITS));

if (sumido.length) {
  console.error(
    `\n  A ajuda cita limite que não existe mais no @gravae/shared:\n\n` +
      sumido.map(({ chave }) => `    LIMITS.${chave}`).join("\n") +
      `\n\n  Acerte em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const limites = LIMITES.map(({ chave, rotulo, formato }) => ({
  rotulo,
  formato,
  valor: LIMITS[chave],
}));

const padrao = new Set<string>(DEFAULT_EVERYONE_PERMISSIONS);

const permissoes = PERMISSION_GROUPS.map((grupo) => ({
  titulo: grupo.label,
  itens: grupo.permissions.map((chave) => ({
    chave,
    nome: PERMISSION_LABELS[chave].nome,
    descricao: PERMISSION_LABELS[chave].descricao,
    padrao: padrao.has(chave),
  })),
}));

const forasDoGrupo = Object.keys(PERMISSION_LABELS).filter(
  (chave) => !PERMISSION_GROUPS.some((grupo) => grupo.permissions.includes(chave as never)),
);

if (forasDoGrupo.length) {
  console.error(
    `\n  Permissão que existe mas não está em grupo nenhum, então sumiria da documentação:\n\n` +
      forasDoGrupo.map((p) => `    ${p}`).join("\n") +
      `\n\n  Ponha num PERMISSION_GROUPS do @gravae/shared e rode de novo.\n`,
  );
  process.exit(1);
}

const fonte = await readFile(ROTAS, "utf8");

const rotas = [...fonte.matchAll(/app\.(get|post|patch|put|delete)\(\s*"([^"]+)"/g)].map(
  ([, metodo, caminho]) => ({ metodo: metodo.toUpperCase(), caminho }),
);

if (!rotas.length) {
  console.error("\n  Não achei rota nenhuma no bot-api.ts. O formato mudou?\n");
  process.exit(1);
}

const semDescricao = rotas
  .map(({ metodo, caminho }) => `${metodo} ${caminho}`)
  .filter((chave) => !DESCRICOES[chave]);

if (semDescricao.length) {
  console.error(
    `\n  Rota nova na API sem entrada na documentação:\n\n` +
      semDescricao.map((r) => `    ${r}`).join("\n") +
      `\n\n  Descreva em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const rest = rotas.map(({ metodo, caminho }) => {
  const chave = `${metodo} ${caminho}`;

  return {
    metodo,
    caminho,
    descricao: DESCRICOES[chave],
    corpo: CORPOS[chave] ?? null,
    parametros: [...caminho.matchAll(/:(\w+)/g)].map(([, nome]) => nome),
  };
});

const eventos = Object.entries(clientEventSchemas).map(([nome, schema]) => {
  const json = z.toJSONSchema(schema, { io: "input" });
  const obrigatorios = new Set(json.required ?? []);

  return {
    nome,
    campos: Object.entries(json.properties ?? {}).map(([campo, tipo]) => ({
      nome: campo,
      tipo: tipo.type ?? (tipo.anyOf ? "vários" : "objeto"),
      obrigatorio: obrigatorios.has(campo),
      limite: tipo.maxLength ?? tipo.maximum ?? null,
    })),
  };
});

const fonteDosEventos = await readFile(EVENTOS, "utf8");
const bloco = fonteDosEventos.match(/export type ServerToClientEvents = \{\n([\s\S]*?)\n\};/);

if (!bloco) {
  console.error("\n  Não achei o ServerToClientEvents no events.ts. O formato mudou?\n");
  process.exit(1);
}

const nomesRecebidos = [...bloco[1].matchAll(/^  "?([\w:]+)"?: \(/gm)].map(([, nome]) => nome);

const semTexto = nomesRecebidos.filter((nome) => !RECEBIDOS[nome]);

if (semTexto.length) {
  console.error(
    `\n  Evento novo que o servidor manda sem entrada na documentação:\n\n` +
      semTexto.map((e) => `    ${e}`).join("\n") +
      `\n\n  Descreva em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const recebidos = nomesRecebidos.map((nome) => ({ nome, descricao: RECEBIDOS[nome] }));

await mkdir(dirname(SAIDA), { recursive: true });
await writeFile(SAIDA, `${JSON.stringify({ rest, eventos, recebidos, limites, permissoes }, null, 2)}\n`);

console.log(
  `referência: ${rest.length} rotas, ${eventos.length} eventos enviados, ` +
    `${recebidos.length} recebidos, ${limites.length} limites e ` +
    `${permissoes.reduce((total, g) => total + g.itens.length, 0)} permissões ` +
    `em src/dados/referencia.json`,
);
