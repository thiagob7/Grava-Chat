import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError } from "~/lib/http.js";

const findMessageById = vi.fn();
const softDelete = vi.fn();
const updateMessage = vi.fn();
const createMessage = vi.fn();
const markRead = vi.fn();
const requireChannelAccess = vi.fn();
const estadosDeLeitura = vi.fn();
const mencoesDesde = vi.fn();
const canaisQueEscuta = vi.fn();
const canaisPorId = vi.fn();
const participacoes = vi.fn();
const comRelacoes = vi.fn();
const removerArquivos = vi.fn();

vi.mock("~/repositories/message-repository.js", () => ({
  messageRepository: {
    findById: (...a: unknown[]) => findMessageById(...a),
    softDelete: (...a: unknown[]) => softDelete(...a),
    update: (...a: unknown[]) => updateMessage(...a),
    create: (...a: unknown[]) => createMessage(...a),
    findByIdWithRelations: (...a: unknown[]) => comRelacoes(...a),
  },
  reactionRepository: { findManyByMessage: vi.fn(), add: vi.fn(), remove: vi.fn() },
  readStateRepository: {
    markRead: (...a: unknown[]) => markRead(...a),
    findManyByUser: (...a: unknown[]) => estadosDeLeitura(...a),
    countUnread: vi.fn(),
    countMentions: vi.fn(),
    mentionsSince: (...a: unknown[]) => mencoesDesde(...a),
  },
}));

vi.mock("~/services/access-service.js", () => ({
  accessService: {
    requireChannelAccess: (...a: unknown[]) => requireChannelAccess(...a),
    listenableChannels: (...a: unknown[]) => canaisQueEscuta(...a),
  },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  channelRepository: {
    findById: vi.fn(),
    guildIdsOf: (...a: unknown[]) => canaisPorId(...a),
  },
  memberRepository: {
    find: vi.fn(),
    membershipsOf: (...a: unknown[]) => participacoes(...a),
  },
  guildRepository: { findById: vi.fn() },
  categoryRepository: {},
}));

const cargosDoServidor = vi.fn();

vi.mock("~/repositories/role-repository.js", () => ({
  roleRepository: { findManyByGuild: (...a: unknown[]) => cargosDoServidor(...a) },
  overwriteRepository: {},
}));

vi.mock("~/repositories/expression-repository.js", () => ({
  expressionRepository: { findStickerById: vi.fn() },
}));

vi.mock("~/services/automod-service.js", () => ({
  autoModService: { avaliar: vi.fn() },
}));

vi.mock("~/services/forum-service.js", () => ({
  forumService: { requirePostAberto: vi.fn(), registrarResposta: vi.fn() },
}));

vi.mock("~/lib/redis.js", () => ({
  redis: { set: vi.fn(), ttl: vi.fn(), incr: vi.fn(async () => 1), expire: vi.fn() },
  keys: { slowmode: () => "slow:teste", fluxoDeMensagens: () => "fluxo:teste" },
}));

const { messageService } = await import("~/services/message-service.js");

const AUTHOR = "6a8781da7415b08f427be1a4";
const OUTRO = "6a8781f57415b08f427be1ad";
const CHANNEL = "6a8781db7415b08f427be1aa";

const contextoComum = {
  permissions: new Set(["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "ADD_REACTIONS"]),
  member: { timeoutUntil: null },
  roles: [],
  isOwner: false,
};

const textChannel = {
  channel: { id: CHANNEL, type: "TEXT", guildId: "g1", slowmodeSeconds: 0 },
  contexto: contextoComum,
};

const messageRow = {
  id: "m1",
  channelId: CHANNEL,
  authorId: AUTHOR,
  content: "oi",
  attachments: [],
  reactions: [],
  replyToId: null,
  createdAt: new Date(),
  editedAt: null,
  deletedAt: null,
  author: {
    id: AUTHOR,
    username: "thiago",
    displayName: "Thiago",
    avatarUrl: null,
    status: "ONLINE",
  },
};

const CARGO_MENCIONAVEL = "6a8781db7415b08f427be1ab";
const CARGO_FECHADO = "6a8781db7415b08f427be1ac";

beforeEach(() => {
  vi.clearAllMocks();
  requireChannelAccess.mockResolvedValue(textChannel);
  createMessage.mockResolvedValue(messageRow);
  cargosDoServidor.mockResolvedValue([
    { id: CARGO_MENCIONAVEL, mentionable: true },
    { id: CARGO_FECHADO, mentionable: false },
  ]);
});

const gravado = () => createMessage.mock.calls.at(-1)?.[0];

const comPermissao = (...extras: string[]) => ({
  ...textChannel,
  contexto: { ...contextoComum, permissions: new Set([...contextoComum.permissions, ...extras]) },
});

describe("menções", () => {
  it("guarda o id de quem foi mencionado", async () => {
    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `oi <@${OUTRO}>` });

    expect(gravado().mentions).toEqual([OUTRO]);
  });

  it("responder com aviso menciona o autor citado, sem mexer no texto", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: OUTRO });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: "eae joão",
      replyToId: "m9",
      mencionarAutor: true,
    });

    expect(gravado().mentions).toEqual([OUTRO]);
    expect(gravado().content).toBe("eae joão");
  });

  it("responder sem o aviso não menciona ninguém", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: OUTRO });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: "eae joão",
      replyToId: "m9",
    });

    expect(gravado().mentions).toEqual([]);
  });

  it("responder a si mesmo não se menciona", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: AUTHOR });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: "complementando",
      replyToId: "m9",
      mencionarAutor: true,
    });

    expect(gravado().mentions).toEqual([]);
  });

  it("não repete o autor citado quando ele já está no texto", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: OUTRO });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: `<@${OUTRO}> olha isso`,
      replyToId: "m9",
      mencionarAutor: true,
    });

    expect(gravado().mentions).toEqual([OUTRO]);
  });

  it("não confunde menção de cargo com menção de pessoa", async () => {
    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: `<@&${CARGO_MENCIONAVEL}>`,
    });

    expect(gravado().mentions).toEqual([]);
    expect(gravado().mentionRoleIds).toEqual([CARGO_MENCIONAVEL]);
  });

  it("cargo que não é mencionável não pinga", async () => {
    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `<@&${CARGO_FECHADO}>` });

    expect(gravado().mentionRoleIds).toEqual([]);
  });

  it("quem tem MENTION_EVERYONE menciona cargo fechado também", async () => {
    requireChannelAccess.mockResolvedValue(comPermissao("MENTION_EVERYONE"));

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `<@&${CARGO_FECHADO}>` });

    expect(gravado().mentionRoleIds).toEqual([CARGO_FECHADO]);
  });

  it("sem permissão, @everyone é APAGADO e a mensagem passa", async () => {
    await messageService.send(AUTHOR, { channelId: CHANNEL, content: "bom dia @everyone" });

    expect(gravado().mentionEveryone).toBe(false);
    expect(gravado().content).toBe("bom dia @everyone");
  });

  it("com permissão, @everyone vale", async () => {
    requireChannelAccess.mockResolvedValue(comPermissao("MENTION_EVERYONE"));

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: "@here alguém aí?" });

    expect(gravado().mentionEveryone).toBe(true);
  });

  it("na DM não há cargo nem @everyone", async () => {
    requireChannelAccess.mockResolvedValue({
      channel: { id: CHANNEL, type: "TEXT", guildId: null, slowmodeSeconds: 0 },
      contexto: null,
    });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: `@everyone <@&${CARGO_MENCIONAVEL}>`,
    });

    expect(gravado().mentionEveryone).toBe(false);
    expect(gravado().mentionRoleIds).toEqual([]);
    expect(cargosDoServidor).not.toHaveBeenCalled();
  });
});

describe("enviar", () => {
  it("recusa mensagem vazia sem anexo", async () => {
    await expect(
      messageService.send(AUTHOR, { channelId: CHANNEL, content: "   " }),
    ).rejects.toThrow("Mensagem vazia");

    expect(createMessage).not.toHaveBeenCalled();
  });

  it("aceita mensagem em canal de voz — é o chat que fica ao lado da chamada", async () => {
    requireChannelAccess.mockResolvedValue({
      channel: { id: CHANNEL, type: "VOICE", guildId: "g1", slowmodeSeconds: 0 },
      contexto: contextoComum,
    });
    createMessage.mockResolvedValue(messageRow);

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: "oi" });
    expect(createMessage).toHaveBeenCalled();
  });

  it("no fórum, recusa mensagem que não está dentro de um assunto", async () => {
    requireChannelAccess.mockResolvedValue({
      channel: { id: CHANNEL, type: "FORUM", guildId: "g1", slowmodeSeconds: 0 },
      contexto: contextoComum,
    });

    await expect(
      messageService.send(AUTHOR, { channelId: CHANNEL, content: "oi" }),
    ).rejects.toThrow("assunto");
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("extrai menções do conteúdo e marca o canal como lido", async () => {
    createMessage.mockResolvedValue({ ...messageRow, content: `oi <@${OUTRO}>` });

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `oi <@${OUTRO}>` });

    expect(createMessage).toHaveBeenCalledWith(expect.objectContaining({ mentions: [OUTRO] }));
    expect(markRead).toHaveBeenCalledWith(AUTHOR, CHANNEL, "m1");
  });
});

describe("editar", () => {
  it("só o autor edita", async () => {
    findMessageById.mockResolvedValue(messageRow);

    await expect(
      messageService.edit(OUTRO, { messageId: "m1", content: "hackeado" }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    expect(updateMessage).not.toHaveBeenCalled();
  });

  it("mensagem apagada não pode ser editada", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, deletedAt: new Date() });

    await expect(
      messageService.edit(AUTHOR, { messageId: "m1", content: "x" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("apagar", () => {
  it("o autor apaga a própria mensagem", async () => {
    findMessageById.mockResolvedValue(messageRow);

    await messageService.remove(AUTHOR, "m1");
    expect(softDelete).toHaveBeenCalledWith("m1");
  });

  it("membro comum não apaga mensagem alheia", async () => {
    findMessageById.mockResolvedValue(messageRow);

    await expect(messageService.remove(OUTRO, "m1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("quem tem MANAGE_MESSAGES apaga mensagem de qualquer um (moderação)", async () => {
    findMessageById.mockResolvedValue(messageRow);
    requireChannelAccess.mockResolvedValue({
      ...textChannel,
      contexto: { permissions: new Set(["VIEW_CHANNEL", "MANAGE_MESSAGES"]) },
    });

    await messageService.remove(OUTRO, "m1");
    expect(softDelete).toHaveBeenCalledWith("m1");
  });
});

describe("o selo de menção nos canais que ninguém abriu", () => {
  const SERVIDOR = "6a8781db7415b08f427be100";
  const NUNCA_ABERTO = "6a8781db7415b08f427be101";
  const JA_LIDO = "6a8781db7415b08f427be102";
  const ENTROU_EM = new Date("2026-08-01T12:00:00Z");

  beforeEach(() => {
    estadosDeLeitura.mockResolvedValue([]);
    participacoes.mockResolvedValue([
      { guildId: SERVIDOR, roleIds: [CARGO_MENCIONAVEL], joinedAt: ENTROU_EM },
    ]);
    canaisQueEscuta.mockResolvedValue([NUNCA_ABERTO]);
    canaisPorId.mockResolvedValue([
      { id: NUNCA_ABERTO, guildId: SERVIDOR, name: "geral" },
    ]);
    mencoesDesde.mockResolvedValue(new Map([[NUNCA_ABERTO, 2]]));
  });

  it("conta menção em canal sem estado de leitura nenhum", async () => {
    const estados = await messageService.readStates(AUTHOR);

    expect(estados).toEqual([
      {
        channelId: NUNCA_ABERTO,
        guildId: SERVIDOR,
        channelName: "geral",
        lastReadMessageId: null,
        unreadCount: 0,
        mentionCount: 2,
      },
    ]);
  });

  it("procura a partir da data de entrada no servidor, e com os cargos de quem pergunta", async () => {
    await messageService.readStates(AUTHOR);

    expect(mencoesDesde).toHaveBeenCalledWith(
      [NUNCA_ABERTO],
      ENTROU_EM,
      AUTHOR,
      [CARGO_MENCIONAVEL],
    );
  });

  it("não conta duas vezes o canal que já tem estado", async () => {
    estadosDeLeitura.mockResolvedValue([
      { channelId: JA_LIDO, lastReadMessageId: null },
    ]);
    canaisQueEscuta.mockResolvedValue([JA_LIDO, NUNCA_ABERTO]);
    canaisPorId.mockResolvedValue([{ id: NUNCA_ABERTO, guildId: SERVIDOR, name: "geral" }]);

    await messageService.readStates(AUTHOR);

    expect(mencoesDesde).toHaveBeenCalledWith([NUNCA_ABERTO], ENTROU_EM, AUTHOR, [
      CARGO_MENCIONAVEL,
    ]);
  });

  it("não olha canal que a pessoa não pode ver", async () => {
    canaisQueEscuta.mockResolvedValue([]);

    expect(await messageService.readStates(AUTHOR)).toEqual([]);
    expect(mencoesDesde).not.toHaveBeenCalled();
  });

  it("não vai ao banco quando a pessoa não está em servidor nenhum", async () => {
    participacoes.mockResolvedValue([]);

    expect(await messageService.readStates(AUTHOR)).toEqual([]);
    expect(canaisQueEscuta).not.toHaveBeenCalled();
  });
});

describe("remover um anexo", () => {
  const comAnexos = {
    ...messageRow,
    content: "olha o arquivo",
    attachments: [
      { id: "a1", url: "u1", filename: "um.txt", contentType: "text/plain", size: 10 },
      { id: "a2", url: "u2", filename: "dois.txt", contentType: "text/plain", size: 20 },
    ],
  };

  it("tira so o anexo pedido e mantem os outros", async () => {
    findMessageById.mockResolvedValue(comAnexos);
    comRelacoes.mockResolvedValue({ ...comAnexos, attachments: [comAnexos.attachments[1]] });

    const r = await messageService.removerAnexo(AUTHOR, "m1", "a1");

    expect(r.apagouAMensagem).toBe(false);
    expect(updateMessage).toHaveBeenCalledWith("m1", {
      attachments: { set: [comAnexos.attachments[1]] },
    });
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("apaga a mensagem quando o anexo era a unica coisa nela", async () => {
    findMessageById.mockResolvedValue({
      ...comAnexos,
      content: "",
      attachments: [comAnexos.attachments[0]],
    });

    const r = await messageService.removerAnexo(AUTHOR, "m1", "a1");

    expect(r.apagouAMensagem).toBe(true);
    expect(softDelete).toHaveBeenCalledWith("m1");
  });

  it("nao apaga a mensagem se ainda sobra texto", async () => {
    findMessageById.mockResolvedValue({
      ...comAnexos,
      attachments: [comAnexos.attachments[0]],
    });
    comRelacoes.mockResolvedValue({ ...comAnexos, attachments: [] });

    const r = await messageService.removerAnexo(AUTHOR, "m1", "a1");

    expect(r.apagouAMensagem).toBe(false);
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("membro comum nao mexe no anexo dos outros", async () => {
    findMessageById.mockResolvedValue(comAnexos);

    await expect(messageService.removerAnexo(OUTRO, "m1", "a1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(updateMessage).not.toHaveBeenCalled();
  });

  it("anexo que nao existe na mensagem da NotFound", async () => {
    findMessageById.mockResolvedValue(comAnexos);

    await expect(messageService.removerAnexo(AUTHOR, "m1", "a9")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
