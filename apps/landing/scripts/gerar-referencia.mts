import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "zod";
import {
  channelSchema,
  clientEventSchemas,
  botCommandSchema,
  DEFAULT_EVERYONE_PERMISSIONS,
  guildEmojiSchema,
  guildMemberSchema,
  guildSchema,
  LIMITS,
  messageSchema,
  FAILURE_REASONS,
  roleSchema,
  voiceStateSchema,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from "@gravae/shared";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROTAS = join(HERE, "..", "..", "api", "src", "routes", "bot-api.ts");
const EVENTOS = join(HERE, "..", "..", "..", "packages", "shared", "src", "events.ts");
const OUTPUT = join(HERE, "..", "src", "dados", "referencia.json");

const DESCRIPTIONS = {
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
  "PUT /bot/guilds/:guildId/channels/:channelId/permissions/:targetId":
    "Define o que um cargo ou uma pessoa pode fazer num canal. Serve pra abrir um canal privado só pra alguém.",
  "DELETE /bot/guilds/:guildId/channels/:channelId/permissions/:targetId":
    "Tira a regra do cargo ou da pessoa naquele canal, voltando ao que vale no servidor.",
  "POST /bot/interactions/:interactionId/:token/callback":
    "Responde a um clique em botão ou menu, ou a um comando de barra. `reply` manda mensagem no canal (com `ephemeral: true`, só quem clicou vê), `update` edita a mensagem do botão, `defer` só avisa que recebeu e `modal` abre um formulário de até 5 campos. Uma resposta por interação, em até 3 segundos.",
  "PUT /bot/comandos": "Registra a lista de comandos de barra do bot. Substitui a anterior.",
  "POST /bot/canais/:channelId/mensagens":
    "Manda uma mensagem no canal. Com `embeds`, ela vem em cartões com título, campos, cor, imagem e rodapé; com `components`, ganha botões e menus.",
  "GET /bot/canais/:channelId/mensagens":
    "Lê o histórico do canal, do mais novo pro mais velho. `limit` até 100, `before` pra paginar.",
  "GET /bot/canais/:channelId/fixadas": "As mensagens fixadas do canal.",
  "PUT /bot/mensagens/:messageId/fixar": "Fixa a mensagem no canal.",
  "DELETE /bot/mensagens/:messageId/fixar": "Desafixa a mensagem.",
  "PATCH /bot/mensagens/:messageId":
    "Edita uma mensagem do próprio bot. Mande `content`, `embeds`, `components` ou uma mistura; o que ficar de fora não muda.",
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
  "command:invoked": "Chamaram um comando de barra do bot. Vem com `id` e `token` pra responder, inclusive só pra quem chamou.",
  "commands:changed": "A lista de comandos do servidor mudou.",
  "interaction:created": "Clicaram num botão, escolheram num menu ou enviaram um formulário do bot (`type: modal`, com `fields`). Vem com `id` e `token` pra responder.",
  "interaction:modal": "O bot abriu um formulário pra quem está conectado preencher.",
  "interaction:finished": "O bot respondeu ao clique de quem está conectado. É o que tira o botão do estado de espera.",
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

const CODIGOS = {
  400: "O pedido não passou na validação. Vem com `issues`, dizendo qual campo e por quê.",
  401: "Sem credencial, ou com credencial vencida. Gere outro token.",
  403: "Autenticado, mas sem permissão para isto neste servidor ou canal.",
  404: "Não existe — ou existe e você não pode enxergar. A resposta é a mesma de propósito.",
  409: "Conflito com o estado atual. O caso comum é criar algo que já existe.",
  429: "Rápido demais. Espere o que diz o cabeçalho e tente de novo.",
  500: "Erro nosso. Se repetir, é bug: abra um chamado com o horário.",
};

const REASONS = {
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

const BODIES = {
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
  "POST /bot/canais/:channelId/mensagens":
    "botSendMessageInput — content, embeds?, components?, attachments?, poll?, replyToId?",
  "PATCH /bot/mensagens/:messageId": "botEditMessageInput — { content?, embeds?, components? }",
  "POST /bot/interactions/:interactionId/:token/callback":
    "{ type: reply, data: botSendMessageInput & { ephemeral? } } | { type: update, data: botEditMessageInput } | { type: defer } | { type: modal, data: modalInput }",
  "PUT /bot/guilds/:guildId/channels/:channelId/permissions/:targetId":
    "{ type: ROLE | MEMBER, allow: string[], deny: string[] }",
  "PUT /bot/mensagens/:messageId/reacoes/:emoji": "{ burst?: boolean }",
};

const LIMITES = [
  { key: "messageLength", label: "Tamanho de uma mensagem", format: "caracteres" },
  { key: "attachmentsPerMessage", label: "Anexos por mensagem", format: "numero" },
  { key: "attachmentBytes", label: "Tamanho de cada anexo", format: "bytes" },
  { key: "avatarBytes", label: "Tamanho da foto de perfil", format: "bytes" },
  { key: "bannerBytes", label: "Tamanho do banner", format: "bytes" },
  { key: "bio", label: "Sobre mim", format: "caracteres" },
  { key: "customStatus", label: "Recado do perfil", format: "caracteres" },
  { key: "emojisByServer", label: "Emojis por servidor", format: "numero" },
  { key: "stickersByServer", label: "Figurinhas por servidor", format: "numero" },
  { key: "soundsByServer", label: "Sons por servidor", format: "numero" },
  { key: "optionsByPoll", label: "Opções por enquete", format: "numero" },
  { key: "embedsPerMessage", label: "Cartões (embeds) por mensagem", format: "numero" },
  { key: "embedFields", label: "Campos por cartão", format: "numero" },
  { key: "embedTotalLength", label: "Texto somado dos cartões de uma mensagem", format: "caracteres" },
  { key: "componentRows", label: "Linhas de botões e menus por mensagem", format: "numero" },
  { key: "componentsPerRow", label: "Botões por linha", format: "numero" },
  { key: "selectOptions", label: "Opções por menu", format: "numero" },
  { key: "modalFields", label: "Campos por formulário", format: "numero" },
  { key: "modalFieldLength", label: "Texto de um campo do formulário", format: "caracteres" },
  { key: "messagesPinned", label: "Mensagens fixadas por canal", format: "numero" },
  { key: "modeSlowMax", label: "Modo lento, no máximo", format: "segundos" },
] as const;

const sumido = LIMITES.filter(({ key }) => !(key in LIMITS));

if (sumido.length) {
  console.error(
    `\n  A ajuda cita limite que não existe mais no @gravae/shared:\n\n` +
      sumido.map(({ key }) => `    LIMITS.${key}`).join("\n") +
      `\n\n  Acerte em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const limits = LIMITES.map(({ key, label, format }) => ({
  label,
  format,
  value: LIMITS[key],
}));

const fallback = new Set<string>(DEFAULT_EVERYONE_PERMISSIONS);

const permissions = PERMISSION_GROUPS.map((group) => ({
  title: group.label,
  items: group.permissions.map((key) => ({
    key,
    name: PERMISSION_LABELS[key].name,
    description: PERMISSION_LABELS[key].description,
    fallback: fallback.has(key),
  })),
}));

const forasDoGrupo = Object.keys(PERMISSION_LABELS).filter(
  (key) => !PERMISSION_GROUPS.some((group) => group.permissions.includes(key as never)),
);

if (forasDoGrupo.length) {
  console.error(
    `\n  Permissão que existe mas não está em grupo nenhum, então sumiria da documentação:\n\n` +
      forasDoGrupo.map((p) => `    ${p}`).join("\n") +
      `\n\n  Ponha num PERMISSION_GROUPS do @gravae/shared e rode de novo.\n`,
  );
  process.exit(1);
}

const font = await readFile(ROTAS, "utf8");

const routes = [...font.matchAll(/app\.(get|post|patch|put|delete)\(\s*"([^"]+)"/g)].map(
  ([, method, path]) => ({ method: method.toUpperCase(), path }),
);

if (!routes.length) {
  console.error("\n  Não achei rota nenhuma no bot-api.ts. O formato mudou?\n");
  process.exit(1);
}

const semDescricao = routes
  .map(({ method, path }) => `${method} ${path}`)
  .filter((key) => !DESCRIPTIONS[key]);

if (semDescricao.length) {
  console.error(
    `\n  Rota nova na API sem entrada na documentação:\n\n` +
      semDescricao.map((r) => `    ${r}`).join("\n") +
      `\n\n  Descreva em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const OBJETOS = [
  {
    id: "mensagem",
    name: "Mensagem",
    summary: "O que o bot escreve, edita, fixa e reage. É o objeto mais movimentado da API.",
    esquema: "messageSchema",
    routes: /^\/bot\/(mensagens|canais\/:channelId\/(mensagens|fixadas))/,
    events: [
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
    name: "Canal",
    summary: "Onde a conversa acontece: texto, voz e fórum, com suas categorias e permissões.",
    esquema: "channelSchema",
    routes: /^\/bot\/(servidores\/:guildId\/canais|guilds\/:guildId\/channels)/,
    events: ["channel:created", "channel:updated", "channel:deleted", "post:created", "post:updated"],
  },
  {
    id: "servidor",
    name: "Servidor",
    summary: "A comunidade inteira. O bot só enxerga os servidores em que foi adicionado.",
    esquema: "guildSchema",
    routes: /^\/bot\/servidores(\/:guildId)?$/,
    events: ["guild:updated", "guild:deleted", "guild:refresh", "event:updated"],
  },
  {
    id: "membro",
    name: "Membro",
    summary: "Uma pessoa dentro de um servidor: apelido, cargos e desde quando está lá.",
    esquema: "guildMemberSchema",
    routes: /^\/bot\/servidores\/:guildId\/membros/,
    events: ["member:joined", "member:updated", "member:left", "presence:changed", "user:updated"],
  },
  {
    id: "cargo",
    name: "Cargo",
    summary: "O que dá poder a um membro. Ordem importa: o de cima ganha na cor e na hierarquia.",
    esquema: "roleSchema",
    routes: /^\/bot\/servidores\/:guildId\/cargos/,
    events: [],
  },
  {
    id: "moderacao",
    name: "Moderação",
    summary: "Castigo e banimento. As duas ações que tiram alguém de circulação.",
    esquema: null,
    routes: /^\/bot\/servidores\/:guildId\/(castigos|banimentos)/,
    events: [],
  },
  {
    id: "expressao",
    name: "Expressão",
    summary: "Emojis, figurinhas e sons do servidor.",
    esquema: "guildEmojiSchema",
    routes: /^\/bot\/servidores\/:guildId\/(expressoes|emojis)/,
    events: ["expressions:changed"],
  },
  {
    id: "voz",
    name: "Voz",
    summary: "Quem está na chamada e o que está fazendo lá. Só por evento — não há rota REST de voz.",
    esquema: "voiceStateSchema",
    routes: null,
    events: [
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
    name: "Aplicativo",
    summary: "O próprio bot: quem ele é e quais comandos de barra ele oferece.",
    esquema: "botCommandSchema",
    routes: /^\/bot\/(eu|comandos|interactions\/)/,
    events: ["command:invoked", "commands:changed", "interaction:created", "interaction:finished", "interaction:modal"],
  },
  {
    id: "webhook",
    name: "Webhook",
    summary: "Um endereço que escreve num canal sem precisar de bot conectado.",
    esquema: null,
    routes: /^\/bot\/servidores\/:guildId\/webhooks/,
    events: [],
  },
  {
    id: "convite",
    name: "Convite",
    summary: "O link que leva alguém para dentro do servidor.",
    esquema: null,
    routes: /^\/bot\/servidores\/:guildId\/convites/,
    events: [],
  },
  {
    id: "auditoria",
    name: "Auditoria",
    summary: "O registro do que a equipe fez no servidor, e de quem fez.",
    esquema: null,
    routes: /^\/bot\/servidores\/:guildId\/auditoria/,
    events: [],
  },
] as const;

const GRUPOS_DE_ROTA = [
  { title: "Identidade", test: /^\/bot\/(eu|comandos)$/ },
  { title: "Interações", test: /^\/bot\/interactions\// },
  { title: "Mensagens", test: /^\/bot\/(mensagens|canais\/:channelId\/(mensagens|fixadas))/ },
  { title: "Servidores e canais", test: /^\/bot\/servidores(\/:guildId(\/canais|\/convites)?)?$/ },
  { title: "Membros e moderação", test: /^\/bot\/servidores\/:guildId\/(membros|castigos|banimentos|auditoria)/ },
  { title: "Cargos", test: /^\/bot\/servidores\/:guildId\/cargos/ },
  { title: "Expressões", test: /^\/bot\/servidores\/:guildId\/(expressoes|emojis)/ },
  { title: "Webhooks", test: /^\/bot\/servidores\/:guildId\/webhooks/ },
  { title: "Servidores e canais", test: /^\/bot\/servidores\/:guildId\/canais/ },
  { title: "Servidores e canais", test: /^\/bot\/guilds\/:guildId\/channels\/:channelId\/permissions/ },
];

const grupoDa = (path: string) =>
  GRUPOS_DE_ROTA.find(({ test }) => test.test(path))?.title;

const semGrupo = routes.filter(({ path }) => !grupoDa(path));

if (semGrupo.length) {
  console.error(
    `\n  Rota que não cai em grupo nenhum, então ficaria solta na página:\n\n` +
      semGrupo.map(({ method, path }) => `    ${method} ${path}`).join("\n") +
      `\n\n  Acrescente um GRUPOS_DE_ROTA em apps/landing/scripts/gerar-referencia.mts.\n`,
  );
  process.exit(1);
}

const rest = routes.map(({ method, path }) => {
  const key = `${method} ${path}`;

  return {
    method,
    path,
    group: grupoDa(path)!,
    description: DESCRIPTIONS[key],
    body: BODIES[key] ?? null,
    parametros: [...path.matchAll(/:(\w+)/g)].map(([, name]) => name),
  };
});

const events = Object.entries(clientEventSchemas).map(([name, schema]) => {
  const json = z.toJSONSchema(schema, { io: "input" });
  const obrigatorios = new Set(json.required ?? []);

  return {
    name,
    fields: Object.entries(json.properties ?? {}).map(([field, kind]) => ({
      name: field,
      kind: kind.type ?? (kind.anyOf ? "vários" : "objeto"),
      required: obrigatorios.has(field),
      limit: kind.maxLength ?? kind.maximum ?? null,
    })),
  };
});

const fonteDosEventos = await readFile(EVENTOS, "utf8");
const block = fonteDosEventos.match(/export type ServerToClientEvents = \{\n([\s\S]*?)\n\};/);

if (!block) {
  console.error("\n  Não achei o ServerToClientEvents no events.ts. O formato mudou?\n");
  process.exit(1);
}

const nomesRecebidos = [...block[1].matchAll(/^  "?([\w:]+)"?: \(/gm)].map(([, name]) => name);

const semTexto = nomesRecebidos.filter((name) => !RECEBIDOS[name]);

if (semTexto.length) {
  console.error(
    `\n  Evento novo que o servidor manda sem entrada na documentação:\n\n` +
      semTexto.map((e) => `    ${e}`).join("\n") +
      `\n\n  Descreva em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const semTextoDeFalha = FAILURE_REASONS.filter((reason) => !REASONS[reason]);

if (semTextoDeFalha.length) {
  console.error(
    `\n  Motivo de falha novo sem explicação:\n\n` +
      semTextoDeFalha.map((m) => `    ${m}`).join("\n") +
      `\n\n  Descreva em apps/landing/scripts/gerar-referencia.mts e rode de novo.\n`,
  );
  process.exit(1);
}

const ESQUEMAS: Record<string, z.ZodType> = {
  messageSchema,
  channelSchema,
  guildSchema,
  guildMemberSchema,
  roleSchema,
  guildEmojiSchema,
  voiceStateSchema,
  botCommandSchema,
};

const camposDe = (name: string | null) => {
  if (!name) return [];

  const esquema = ESQUEMAS[name];
  if (!esquema) {
    console.error(`\n  Objeto aponta para um esquema que não existe: ${name}\n`);
    process.exit(1);
  }

  const json = z.toJSONSchema(esquema, { io: "output" }) as {
    properties?: Record<string, { type?: string; anyOf?: unknown[] }>;
    required?: string[];
  };

  const obrigatorios = new Set(json.required ?? []);

  return Object.entries(json.properties ?? {}).map(([field, kind]) => ({
    name: field,
    kind: kind.type ?? (kind.anyOf ? "vários" : "objeto"),
    required: obrigatorios.has(field),
  }));
};

const objects = OBJETOS.map((object) => ({
  id: object.id,
  name: object.name,
  summary: object.summary,
  fields: camposDe(object.esquema),
  routes: object.routes ? rest.filter((route) => object.routes!.test(route.path)) : [],
  events: object.events.map((name) => {
    const match = RECEBIDOS[name];

    if (!match) {
      console.error(`\n  Objeto ${object.id} cita um evento que não existe: ${name}\n`);
      process.exit(1);
    }

    return { name, description: match };
  }),
}));

const foraDeObjeto = rest.filter(
  (route) => !OBJETOS.some((object) => object.routes?.test(route.path)),
);

if (foraDeObjeto.length) {
  console.error(
    `\n  Rota que não pertence a objeto nenhum:\n\n` +
      foraDeObjeto.map((r) => `    ${r.method} ${r.path}`).join("\n") +
      `\n\n  Acrescente um OBJETOS em apps/landing/scripts/gerar-referencia.mts.\n`,
  );
  process.exit(1);
}

const failures = {
  codes: Object.entries(CODIGOS).map(([code, when]) => ({ code: Number(code), when })),
  reasons: FAILURE_REASONS.map((reason) => ({ reason, when: REASONS[reason] })),
};

const received = nomesRecebidos.map((name) => ({ name, description: RECEBIDOS[name] }));

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify({ rest, events, received, objects, limits, permissions, failures }, null, 2)}\n`);

const fonteDosDocs = await readFile(join(HERE, "..", "src", "dados", "docs.ts"), "utf8");

const paginasDosDocs = [
  ...fonteDosDocs.matchAll(
    /href:\s*"([^"]+)",\s*\n\s*title:\s*"([^"]+)",\s*\n\s*summary:\s*"([^"]+)"/g,
  ),
].map(([, href, title, summary]) => ({ href, title, summary }));

if (!paginasDosDocs.length) {
  console.error("\n  Não achei as páginas em src/dados/docs.ts. O formato mudou?\n");
  process.exit(1);
}

const index = [
  "# Gravaê — documentação para desenvolvedores",
  "",
  "Tudo abaixo de um endereço só, com o cabeçalho `Authorization: Bot <token>`.",
  "",
  "## Páginas",
  "",
  ...paginasDosDocs.map((page) => `- [${page.title}](${page.href}): ${page.summary}`),
  "",
  "## Rotas REST",
  "",
  ...rest.map((route) => `- ${route.method} ${route.path} — ${route.description}`),
  "",
  "## Eventos que o bot envia",
  "",
  ...events.map((event) => `- ${event.name}`),
  "",
  "## Eventos que o bot recebe",
  "",
  ...received.map((event) => `- ${event.name} — ${event.description}`),
  "",
  "## Motivos de falha",
  "",
  ...failures.reasons.map((m) => `- ${m.reason} — ${m.when}`),
  "",
].join("\n");

await writeFile(join(HERE, "..", "public", "llms.txt"), `${index}\n`);

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
  ...paginasDosDocs.map((page) => `- ${page.href}`),
  "",
  "## Objects",
  "",
  ...objects.map(
    (object) =>
      `- ${object.name} (${object.id}) — ${object.fields.length} fields, ` +
      `${object.routes.length} routes, ${object.events.length} events`,
  ),
  "",
  "## REST routes",
  "",
  ...rest.map((route) => `- ${route.method} ${route.path}`),
  "",
  "## Events the bot sends",
  "",
  ...events.map((event) => `- ${event.name}`),
  "",
  "## Events the bot receives",
  "",
  ...received.map((event) => `- ${event.name}`),
  "",
  "## Failure reasons",
  "",
  ...failures.reasons.map((m) => `- ${m.reason}`),
  "",
  "## HTTP codes",
  "",
  ...failures.codes.map((c) => `- ${c.code}`),
  "",
].join("\n");

await writeFile(join(HERE, "..", "public", "llms-en.txt"), `${indiceEmIngles}\n`);

console.log(
  `referência: ${rest.length} rotas, ${events.length} eventos enviados, ` +
    `${received.length} recebidos, ${limits.length} limites e ` +
    `${permissions.reduce((total, g) => total + g.items.length, 0)} permissões ` +
    `em src/dados/referencia.json`,
);
