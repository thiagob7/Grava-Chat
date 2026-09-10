import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";
import {
  channelSchema,
  clientEventSchemas,
  comandoDeBotSchema,
  DEFAULT_EVERYONE_PERMISSIONS,
  guildEmojiSchema,
  guildMemberSchema,
  guildSchema,
  LIMITS,
  messageSchema,
  MOTIVOS_DE_FALHA,
  roleSchema,
  voiceStateSchema,
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
  "PATCH /bot/servidores/:guildId": "Muda nome, ícone, banner ou descrição do servidor.",
  "GET /bot/servidores/:guildId/auditoria":
    "Quem fez o quê no servidor. Filtra por `actorId` e `action`, e pagina com `before`.",
  "POST /bot/servidores/:guildId/cargos": "Cria um cargo, já com as permissões dele.",
  "PATCH /bot/servidores/:guildId/cargos/:roleId": "Muda nome, permissões, cor ou ícone do cargo.",
  "DELETE /bot/servidores/:guildId/cargos/:roleId": "Apaga o cargo e tira ele de quem o tinha.",
  "PUT /bot/servidores/:guildId/cargos": "Reordena os cargos. A ordem é quem manda em quem.",
  "GET /bot/servidores/:guildId/expressoes": "Emojis, figurinhas e sons do servidor.",
  "POST /bot/servidores/:guildId/emojis": "Sobe um emoji a partir de uma URL de imagem.",
  "PATCH /bot/servidores/:guildId/emojis/:emojiId": "Renomeia o emoji.",
  "DELETE /bot/servidores/:guildId/emojis/:emojiId": "Apaga o emoji do servidor.",
  "GET /bot/servidores/:guildId/webhooks": "Os webhooks do servidor, com a URL de cada um.",
  "POST /bot/servidores/:guildId/webhooks": "Cria um webhook apontado pra um canal.",
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
  "dm:pedido": "Uma solicitação de mensagem entrou, saiu ou mudou de estado na sua caixa de pedidos.",
  "member:joined": "Entrou gente no servidor.",
  "member:updated": "Cargo ou apelido de um membro mudou.",
  "member:left": "Saiu gente do servidor.",
  "channel:created": "Canal novo.",
  "channel:updated": "Canal renomeado ou remexido.",
  "channel:deleted": "Canal apagado.",
  "event:updated": "A agenda de eventos do servidor mudou: criaram, editaram, cancelaram ou marcaram interesse.",
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

/*
  O que a API responde quando dá errado.

  Os códigos vêm das classes de erro do servidor, e os motivos da lista fechada
  em `falhas.ts`. Como a lista é fechada, um motivo novo sem texto aqui derruba
  o build — mesma trava que já vale para rota e para evento.
*/
const CODIGOS = {
  400: "O pedido não passou na validação. Vem com `issues`, dizendo qual campo e por quê.",
  401: "Sem credencial, ou com credencial vencida. Gere outro token.",
  403: "Autenticado, mas sem permissão para isto neste servidor ou canal.",
  404: "Não existe — ou existe e você não pode enxergar. A resposta é a mesma de propósito.",
  409: "Conflito com o estado atual. O caso comum é criar algo que já existe.",
  429: "Rápido demais. Espere o que diz o cabeçalho e tente de novo.",
  500: "Erro nosso. Se repetir, é bug: abra um chamado com o horário.",
};

const MOTIVOS = {
  "sem-conexao": "A conexão de tempo real caiu no meio do envio.",
  "sem-acesso": "O canal saiu do alcance do bot, ou nunca esteve.",
  "sem-permissao": "Falta a permissão que a ação exige.",
  castigo: "O bot está de castigo neste servidor.",
  "modo-lento": "O modo lento do canal ainda não liberou.",
  depressa: "Passou do limite de velocidade.",
  automod: "A automoderação bloqueou o conteúdo.",
  recusada: "A conversa não aceita resposta, como as de aviso da casa.",
  "nao-entregue": "A pessoa não recebe mensagem de quem não é amigo.",
  erro: "Falha genérica. Vale tentar de novo.",
};

const CORPOS = {
  "PUT /bot/mensagens/:messageId/fixar": "sem corpo — o id vai no endereço",
  "PATCH /bot/servidores/:guildId": "updateGuildInput — tudo opcional",
  "POST /bot/servidores/:guildId/cargos": "createRoleInput — name, permissions[]",
  "PATCH /bot/servidores/:guildId/cargos/:roleId": "updateRoleInput — tudo opcional",
  "PUT /bot/servidores/:guildId/cargos": "{ roles: [{ id, position }] }",
  "POST /bot/servidores/:guildId/emojis": "{ name, url, animated? }",
  "PATCH /bot/servidores/:guildId/emojis/:emojiId": "{ name }",
  "POST /bot/servidores/:guildId/webhooks": "{ name, channelId }",
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

/*
  A referência dividida por OBJETO, e não por transporte.

  Antes existiam duas páginas: uma com todas as rotas, outra com todos os
  eventos. Quem chega não pergunta "quais rotas existem", pergunta "como mando
  uma mensagem" — e a resposta ficava espalhada. Aqui cada objeto reúne o que é,
  os campos que ele tem, as rotas que mexem nele e os eventos que ele dispara.

  A ordem da lista é a ordem da página, e ela vai do que se usa todo dia para o
  que se usa uma vez.
*/
const OBJETOS = [
  {
    id: "mensagem",
    nome: "Mensagem",
    resumo: "O que o bot escreve, edita, fixa e reage. É o objeto mais movimentado da API.",
    esquema: "messageSchema",
    rotas: /^\/bot\/(mensagens|canais\/:channelId\/(mensagens|fixadas))/,
    eventos: [
      "message:created",
      "message:updated",
      "message:deleted",
      "message:reactions",
      "message:super",
      "typing:started",
    ],
  },
  {
    id: "canal",
    nome: "Canal",
    resumo: "Onde a conversa acontece: texto, voz e fórum, com suas categorias e permissões.",
    esquema: "channelSchema",
    rotas: /^\/bot\/servidores\/:guildId\/canais/,
    eventos: ["channel:created", "channel:updated", "channel:deleted", "post:created", "post:updated"],
  },
  {
    id: "servidor",
    nome: "Servidor",
    resumo: "A comunidade inteira. O bot só enxerga os servidores em que foi adicionado.",
    esquema: "guildSchema",
    rotas: /^\/bot\/servidores(\/:guildId)?$/,
    eventos: ["guild:updated", "guild:deleted", "guild:refresh", "event:updated"],
  },
  {
    id: "membro",
    nome: "Membro",
    resumo: "Uma pessoa dentro de um servidor: apelido, cargos e desde quando está lá.",
    esquema: "guildMemberSchema",
    rotas: /^\/bot\/servidores\/:guildId\/membros/,
    eventos: ["member:joined", "member:updated", "member:left", "presence:changed", "user:updated"],
  },
  {
    id: "cargo",
    nome: "Cargo",
    resumo: "O que dá poder a um membro. Ordem importa: o de cima ganha na cor e na hierarquia.",
    esquema: "roleSchema",
    rotas: /^\/bot\/servidores\/:guildId\/cargos/,
    eventos: [],
  },
  {
    id: "moderacao",
    nome: "Moderação",
    resumo: "Castigo e banimento. As duas ações que tiram alguém de circulação.",
    esquema: null,
    rotas: /^\/bot\/servidores\/:guildId\/(castigos|banimentos)/,
    eventos: [],
  },
  {
    id: "expressao",
    nome: "Expressão",
    resumo: "Emojis, figurinhas e sons do servidor.",
    esquema: "guildEmojiSchema",
    rotas: /^\/bot\/servidores\/:guildId\/(expressoes|emojis)/,
    eventos: ["expressions:changed"],
  },
  {
    id: "voz",
    nome: "Voz",
    resumo: "Quem está na chamada e o que está fazendo lá. Só por evento — não há rota REST de voz.",
    esquema: "voiceStateSchema",
    rotas: null,
    eventos: [
      "voice:states",
      "voice:joined",
      "voice:left",
      "voice:updated",
      "voice:sound",
      "voice:move",
      "voice:recusada",
      "live:started",
      "live:ended",
    ],
  },
  {
    id: "aplicativo",
    nome: "Aplicativo",
    resumo: "O próprio bot: quem ele é e quais comandos de barra ele oferece.",
    esquema: "comandoDeBotSchema",
    rotas: /^\/bot\/(eu|comandos)$/,
    eventos: ["command:invoked", "commands:changed"],
  },
  {
    id: "webhook",
    nome: "Webhook",
    resumo: "Um endereço que escreve num canal sem precisar de bot conectado.",
    esquema: null,
    rotas: /^\/bot\/servidores\/:guildId\/webhooks/,
    eventos: [],
  },
  {
    id: "convite",
    nome: "Convite",
    resumo: "O link que leva alguém para dentro do servidor.",
    esquema: null,
    rotas: /^\/bot\/servidores\/:guildId\/convites/,
    eventos: [],
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    resumo: "O registro do que a equipe fez no servidor, e de quem fez.",
    esquema: null,
    rotas: /^\/bot\/servidores\/:guildId\/auditoria/,
    eventos: [],
  },
] as const;

const GRUPOS_DE_ROTA = [
  { titulo: "Identidade", teste: /^\/bot\/(eu|comandos)$/ },
  { titulo: "Mensagens", teste: /^\/bot\/(mensagens|canais\/:channelId\/(mensagens|fixadas))/ },
  { titulo: "Servidores e canais", teste: /^\/bot\/servidores(\/:guildId(\/canais|\/convites)?)?$/ },
  { titulo: "Membros e moderação", teste: /^\/bot\/servidores\/:guildId\/(membros|castigos|banimentos|auditoria)/ },
  { titulo: "Cargos", teste: /^\/bot\/servidores\/:guildId\/cargos/ },
  { titulo: "Expressões", teste: /^\/bot\/servidores\/:guildId\/(expressoes|emojis)/ },
  { titulo: "Webhooks", teste: /^\/bot\/servidores\/:guildId\/webhooks/ },
  { titulo: "Servidores e canais", teste: /^\/bot\/servidores\/:guildId\/canais/ },
];

const grupoDa = (caminho: string) =>
  GRUPOS_DE_ROTA.find(({ teste }) => teste.test(caminho))?.titulo;

const semGrupo = rotas.filter(({ caminho }) => !grupoDa(caminho));

if (semGrupo.length) {
  console.error(
    `\n  Rota que não cai em grupo nenhum, então ficaria solta na página:\n\n` +
      semGrupo.map(({ metodo, caminho }) => `    ${metodo} ${caminho}`).join("\n") +
      `\n\n  Acrescente um GRUPOS_DE_ROTA em apps/landing/scripts/gerar-referencia.mts.\n`,
  );
  process.exit(1);
}

const rest = rotas.map(({ metodo, caminho }) => {
  const chave = `${metodo} ${caminho}`;

  return {
    metodo,
    caminho,
    grupo: grupoDa(caminho)!,
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

const semTextoDeFalha = MOTIVOS_DE_FALHA.filter((motivo) => !MOTIVOS[motivo]);

if (semTextoDeFalha.length) {
  console.error(
    `\n  Motivo de falha novo sem explicação:\n\n` +
      semTextoDeFalha.map((m) => `    ${m}`).join("\n") +
      `\n\n  Descreva em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

/*
  Os campos de cada objeto saem do MESMO esquema que o servidor usa para
  validar. Se um campo entrou na API, ele aparece aqui sem ninguém escrever
  nada — e se saiu, some.
*/
const ESQUEMAS: Record<string, z.ZodType> = {
  messageSchema,
  channelSchema,
  guildSchema,
  guildMemberSchema,
  roleSchema,
  guildEmojiSchema,
  voiceStateSchema,
  comandoDeBotSchema,
};

const camposDe = (nome: string | null) => {
  if (!nome) return [];

  const esquema = ESQUEMAS[nome];
  if (!esquema) {
    console.error(`\n  Objeto aponta para um esquema que não existe: ${nome}\n`);
    process.exit(1);
  }

  const json = z.toJSONSchema(esquema, { io: "output" }) as {
    properties?: Record<string, { type?: string; anyOf?: unknown[] }>;
    required?: string[];
  };

  const obrigatorios = new Set(json.required ?? []);

  return Object.entries(json.properties ?? {}).map(([campo, tipo]) => ({
    nome: campo,
    tipo: tipo.type ?? (tipo.anyOf ? "vários" : "objeto"),
    obrigatorio: obrigatorios.has(campo),
  }));
};

const objetos = OBJETOS.map((objeto) => ({
  id: objeto.id,
  nome: objeto.nome,
  resumo: objeto.resumo,
  campos: camposDe(objeto.esquema),
  rotas: objeto.rotas ? rest.filter((rota) => objeto.rotas!.test(rota.caminho)) : [],
  eventos: objeto.eventos.map((nome) => {
    const achado = RECEBIDOS[nome];

    if (!achado) {
      console.error(`\n  Objeto ${objeto.id} cita um evento que não existe: ${nome}\n`);
      process.exit(1);
    }

    return { nome, descricao: achado };
  }),
}));

/*
  A trava que mantém a divisão honesta: rota que não cai em objeto nenhum
  ficaria invisível na nova referência, e ninguém descobriria até alguém
  procurar por ela e não achar.
*/
const foraDeObjeto = rest.filter(
  (rota) => !OBJETOS.some((objeto) => objeto.rotas?.test(rota.caminho)),
);

if (foraDeObjeto.length) {
  console.error(
    `\n  Rota que não pertence a objeto nenhum:\n\n` +
      foraDeObjeto.map((r) => `    ${r.metodo} ${r.caminho}`).join("\n") +
      `\n\n  Acrescente um OBJETOS em apps/landing/scripts/gerar-referencia.mts.\n`,
  );
  process.exit(1);
}

const falhas = {
  codigos: Object.entries(CODIGOS).map(([codigo, quando]) => ({ codigo: Number(codigo), quando })),
  motivos: MOTIVOS_DE_FALHA.map((motivo) => ({ motivo, quando: MOTIVOS[motivo] })),
};

const recebidos = nomesRecebidos.map((nome) => ({ nome, descricao: RECEBIDOS[nome] }));

await mkdir(dirname(SAIDA), { recursive: true });
await writeFile(SAIDA, `${JSON.stringify({ rest, eventos, recebidos, objetos, limites, permissoes, falhas }, null, 2)}\n`);

/*
  O índice em texto puro, para quem lê com máquina.

  Hoje boa parte de quem integra uma API chega por um assistente de código, e
  assistente não navega menu: ele busca um arquivo. É o mesmo papel do
  `llms.txt` que outras plataformas publicam — uma lista chapada do que existe
  e onde está, sem HTML no meio.

  Sai do mesmo lugar que a documentação, então não tem como divergir dela.
*/
/*
  As páginas saem do MESMO arquivo que desenha o menu, lido como texto — o
  script já faz assim com o `events.ts`. Importar o módulo puxaria junto o
  resto do app; ler o texto pega só o que interessa e não acopla nada.
*/
const fonteDosDocs = await readFile(join(AQUI, "..", "src", "dados", "docs.ts"), "utf8");

const paginasDosDocs = [
  ...fonteDosDocs.matchAll(
    /href:\s*"([^"]+)",\s*\n\s*titulo:\s*"([^"]+)",\s*\n\s*resumo:\s*"([^"]+)"/g,
  ),
].map(([, href, titulo, resumo]) => ({ href, titulo, resumo }));

if (!paginasDosDocs.length) {
  console.error("\n  Não achei as páginas em src/dados/docs.ts. O formato mudou?\n");
  process.exit(1);
}

const indice = [
  "# Gravaê — documentação para desenvolvedores",
  "",
  "Tudo abaixo de um endereço só, com o cabeçalho `Authorization: Bot <token>`.",
  "",
  "## Páginas",
  "",
  ...paginasDosDocs.map((pagina) => `- [${pagina.titulo}](${pagina.href}): ${pagina.resumo}`),
  "",
  "## Rotas REST",
  "",
  ...rest.map((rota) => `- ${rota.metodo} ${rota.caminho} — ${rota.descricao}`),
  "",
  "## Eventos que o bot envia",
  "",
  ...eventos.map((evento) => `- ${evento.nome}`),
  "",
  "## Eventos que o bot recebe",
  "",
  ...recebidos.map((evento) => `- ${evento.nome} — ${evento.descricao}`),
  "",
  "## Motivos de falha",
  "",
  ...falhas.motivos.map((m) => `- ${m.motivo} — ${m.quando}`),
  "",
].join("\n");

await writeFile(join(AQUI, "..", "public", "llms.txt"), `${indice}\n`);

/*
  A mesma coisa em inglês.

  A documentação inteira ainda é só em português, e traduzir 30 páginas é outro
  trabalho. Mas quem chega de fora — pessoa ou assistente de código — bate
  primeiro neste arquivo, e aqui o custo de traduzir é uma linha por rota. É a
  fatia da Fase 4 que dá para entregar sem esperar o resto.

  Rota e evento não são traduzidos de propósito: `POST /bot/canais/:channelId/mensagens`
  é o endereço de verdade, e traduzir endereço seria mentir sobre a API.
*/
const indiceEmIngles = [
  "# Gravaê — developer documentation",
  "",
  "One base URL, one header: `Authorization: Bot <token>`.",
  "The full documentation is written in Portuguese; this index is the map.",
  "",
  "Base URL: https://gravaechat-api.duckdns.org/api",
  "",
  "## Pages",
  "",
  ...paginasDosDocs.map((pagina) => `- ${pagina.href}`),
  "",
  "## Objects",
  "",
  ...objetos.map(
    (objeto) =>
      `- ${objeto.nome} (${objeto.id}) — ${objeto.campos.length} fields, ` +
      `${objeto.rotas.length} routes, ${objeto.eventos.length} events`,
  ),
  "",
  "## REST routes",
  "",
  ...rest.map((rota) => `- ${rota.metodo} ${rota.caminho}`),
  "",
  "## Events the bot sends",
  "",
  ...eventos.map((evento) => `- ${evento.nome}`),
  "",
  "## Events the bot receives",
  "",
  ...recebidos.map((evento) => `- ${evento.nome}`),
  "",
  "## Failure reasons",
  "",
  ...falhas.motivos.map((m) => `- ${m.motivo}`),
  "",
  "## HTTP codes",
  "",
  ...falhas.codigos.map((c) => `- ${c.codigo}`),
  "",
].join("\n");

await writeFile(join(AQUI, "..", "public", "llms-en.txt"), `${indiceEmIngles}\n`);

console.log(
  `referência: ${rest.length} rotas, ${eventos.length} eventos enviados, ` +
    `${recebidos.length} recebidos, ${limites.length} limites e ` +
    `${permissoes.reduce((total, g) => total + g.itens.length, 0)} permissões ` +
    `em src/dados/referencia.json`,
);
