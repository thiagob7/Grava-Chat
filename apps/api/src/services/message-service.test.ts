import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError } from "~/lib/http.js";

const findMessageById = vi.fn();
const softDelete = vi.fn();
const updateMessage = vi.fn();
const createMessage = vi.fn();
const markRead = vi.fn();
const requireChannelAccess = vi.fn();
const readingStates = vi.fn();
const mentionsSince = vi.fn();
const channelsListen = vi.fn();
const channelsById = vi.fn();
const participations = vi.fn();
const withRelations = vi.fn();
const removeFiles = vi.fn();

vi.mock("~/repositories/message-repository.js", () => ({
  messageRepository: {
    findById: (...a: unknown[]) => findMessageById(...a),
    softDelete: (...a: unknown[]) => softDelete(...a),
    update: (...a: unknown[]) => updateMessage(...a),
    create: (...a: unknown[]) => createMessage(...a),
    findByIdWithRelations: (...a: unknown[]) => withRelations(...a),
  },
  reactionRepository: { findManyByMessage: vi.fn(), add: vi.fn(), remove: vi.fn() },
  readStateRepository: {
    markRead: (...a: unknown[]) => markRead(...a),
    findManyByUser: (...a: unknown[]) => readingStates(...a),
    countUnread: vi.fn(),
    countMentions: vi.fn(),
    mentionsSince: (...a: unknown[]) => mentionsSince(...a),
  },
}));

vi.mock("~/services/access-service.js", () => ({
  accessService: {
    requireChannelAccess: (...a: unknown[]) => requireChannelAccess(...a),
    listenableChannels: (...a: unknown[]) => channelsListen(...a),
  },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  channelRepository: {
    findById: vi.fn(),
    guildIdsOf: (...a: unknown[]) => channelsById(...a),
  },
  memberRepository: {
    find: vi.fn(),
    membershipsOf: (...a: unknown[]) => participations(...a),
  },
  guildRepository: { findById: vi.fn() },
  categoryRepository: {},
}));

const serverRoles = vi.fn();

vi.mock("~/repositories/role-repository.js", () => ({
  roleRepository: { findManyByGuild: (...a: unknown[]) => serverRoles(...a) },
  overwriteRepository: {},
}));

const userById = vi.fn();

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: { findById: (...a: unknown[]) => userById(...a) },
}));

vi.mock("~/repositories/expression-repository.js", () => ({
  expressionRepository: { findStickerById: vi.fn() },
}));

vi.mock("~/services/automod-service.js", () => ({
  autoModService: { evaluate: vi.fn() },
}));

vi.mock("~/services/forum-service.js", () => ({
  forumService: { requirePostIsOpen: vi.fn(), registerReply: vi.fn() },
}));

vi.mock("~/lib/redis.js", () => ({
  redis: { set: vi.fn(), ttl: vi.fn(), incr: vi.fn(async () => 1), expire: vi.fn() },
  keys: { slowmode: () => "slow:teste", messagesFlow: () => "fluxo:teste" },
}));

const { messageService } = await import("~/services/message-service.js");

const AUTHOR = "6a8781da7415b08f427be1a4";
const OTHER = "6a8781f57415b08f427be1ad";
const CHANNEL = "6a8781db7415b08f427be1aa";

const contextCommon = {
  permissions: new Set(["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "ADD_REACTIONS"]),
  member: { timeoutUntil: null },
  roles: [],
  isOwner: false,
};

const textChannel = {
  channel: { id: CHANNEL, type: "TEXT", guildId: "g1", slowmodeSeconds: 0 },
  context: contextCommon,
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

const ROLE_MENTIONABLE = "6a8781db7415b08f427be1ab";
const ROLE_CLOSED = "6a8781db7415b08f427be1ac";

beforeEach(() => {
  vi.clearAllMocks();
  requireChannelAccess.mockResolvedValue(textChannel);
  createMessage.mockResolvedValue(messageRow);
  serverRoles.mockResolvedValue([
    { id: ROLE_MENTIONABLE, mentionable: true },
    { id: ROLE_CLOSED, mentionable: false },
  ]);
});

const recorded = () => createMessage.mock.calls.at(-1)?.[0];

const withPermission = (...extras: string[]) => ({
  ...textChannel,
  context: { ...contextCommon, permissions: new Set([...contextCommon.permissions, ...extras]) },
});

describe("menções", () => {
  it("guarda o id de quem foi mencionado", async () => {
    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `oi <@${OTHER}>` });

    expect(recorded().mentions).toEqual([OTHER]);
  });

  it("responder com aviso menciona o autor citado, sem mexer no texto", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: OTHER });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: "eae joão",
      replyToId: "m9",
      mentionAuthor: true,
    });

    expect(recorded().mentions).toEqual([OTHER]);
    expect(recorded().content).toBe("eae joão");
  });

  it("responder sem o aviso não menciona ninguém", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: OTHER });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: "eae joão",
      replyToId: "m9",
    });

    expect(recorded().mentions).toEqual([]);
  });

  it("responder a si mesmo não se menciona", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: AUTHOR });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: "complementando",
      replyToId: "m9",
      mentionAuthor: true,
    });

    expect(recorded().mentions).toEqual([]);
  });

  it("não repete o autor citado quando ele já está no texto", async () => {
    findMessageById.mockResolvedValue({ ...messageRow, id: "m9", authorId: OTHER });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: `<@${OTHER}> olha isso`,
      replyToId: "m9",
      mentionAuthor: true,
    });

    expect(recorded().mentions).toEqual([OTHER]);
  });

  it("não confunde menção de cargo com menção de pessoa", async () => {
    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: `<@&${ROLE_MENTIONABLE}>`,
    });

    expect(recorded().mentions).toEqual([]);
    expect(recorded().mentionRoleIds).toEqual([ROLE_MENTIONABLE]);
  });

  it("cargo que não é mencionável não pinga", async () => {
    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `<@&${ROLE_CLOSED}>` });

    expect(recorded().mentionRoleIds).toEqual([]);
  });

  it("quem tem MENTION_EVERYONE menciona cargo fechado também", async () => {
    requireChannelAccess.mockResolvedValue(withPermission("MENTION_EVERYONE"));

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `<@&${ROLE_CLOSED}>` });

    expect(recorded().mentionRoleIds).toEqual([ROLE_CLOSED]);
  });

  it("sem permissão, @everyone é APAGADO e a mensagem passa", async () => {
    await messageService.send(AUTHOR, { channelId: CHANNEL, content: "bom dia @everyone" });

    expect(recorded().mentionEveryone).toBe(false);
    expect(recorded().content).toBe("bom dia @everyone");
  });

  it("com permissão, @everyone vale", async () => {
    requireChannelAccess.mockResolvedValue(withPermission("MENTION_EVERYONE"));

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: "@here alguém aí?" });

    expect(recorded().mentionEveryone).toBe(true);
  });

  it("na DM não há cargo nem @everyone", async () => {
    requireChannelAccess.mockResolvedValue({
      channel: { id: CHANNEL, type: "TEXT", guildId: null, slowmodeSeconds: 0 },
      context: null,
    });

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: `@everyone <@&${ROLE_MENTIONABLE}>`,
    });

    expect(recorded().mentionEveryone).toBe(false);
    expect(recorded().mentionRoleIds).toEqual([]);
    expect(serverRoles).not.toHaveBeenCalled();
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
      context: contextCommon,
    });
    createMessage.mockResolvedValue(messageRow);

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: "oi" });
    expect(createMessage).toHaveBeenCalled();
  });

  it("no fórum, recusa mensagem que não está dentro de um assunto", async () => {
    requireChannelAccess.mockResolvedValue({
      channel: { id: CHANNEL, type: "FORUM", guildId: "g1", slowmodeSeconds: 0 },
      context: contextCommon,
    });

    await expect(
      messageService.send(AUTHOR, { channelId: CHANNEL, content: "oi" }),
    ).rejects.toThrow("assunto");
    expect(createMessage).not.toHaveBeenCalled();
  });

  it("na comunidade que exige e-mail confirmado, quem não confirmou não fala", async () => {
    const { guildRepository } = await import("~/repositories/guild-repository.js");
    vi.mocked(guildRepository.findById).mockResolvedValue({
      verifiedRequiresEmail: true,
    } as never);
    userById.mockResolvedValue({ isBot: false, emailVerifiedAt: null });

    await expect(
      messageService.send(AUTHOR, { channelId: CHANNEL, content: "oi" }),
    ).rejects.toThrow("confirmou o e-mail");

    expect(createMessage).not.toHaveBeenCalled();
    vi.mocked(guildRepository.findById).mockReset();
  });

  it("quem já confirmou o e-mail fala normalmente", async () => {
    const { guildRepository } = await import("~/repositories/guild-repository.js");
    vi.mocked(guildRepository.findById).mockResolvedValue({
      verifiedRequiresEmail: true,
    } as never);
    userById.mockResolvedValue({ isBot: false, emailVerifiedAt: new Date() });
    createMessage.mockResolvedValue(messageRow);

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: "oi" });

    expect(createMessage).toHaveBeenCalled();
    vi.mocked(guildRepository.findById).mockReset();
  });

  it("com o filtro de mídia ligado, a imagem chega escondida", async () => {
    const { guildRepository } = await import("~/repositories/guild-repository.js");
    vi.mocked(guildRepository.findById).mockResolvedValue({
      filtersMediaExplicit: true,
    } as never);
    createMessage.mockResolvedValue(messageRow);

    await messageService.send(AUTHOR, {
      channelId: CHANNEL,
      content: "",
      attachments: [
        {
          id: "a1",
          url: "https://exemplo/foto.png",
          filename: "foto.png",
          contentType: "image/png",
          size: 10,
        },
      ],
    });

    expect(createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [expect.objectContaining({ spoiler: true })],
      }),
    );
    vi.mocked(guildRepository.findById).mockReset();
  });

  it("extrai menções do conteúdo e marca o canal como lido", async () => {
    createMessage.mockResolvedValue({ ...messageRow, content: `oi <@${OTHER}>` });

    await messageService.send(AUTHOR, { channelId: CHANNEL, content: `oi <@${OTHER}>` });

    expect(createMessage).toHaveBeenCalledWith(expect.objectContaining({ mentions: [OTHER] }));
    expect(markRead).toHaveBeenCalledWith(AUTHOR, CHANNEL, "m1");
  });
});

describe("editar", () => {
  it("só o autor edita", async () => {
    findMessageById.mockResolvedValue(messageRow);

    await expect(
      messageService.edit(OTHER, { messageId: "m1", content: "hackeado" }),
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

    await expect(messageService.remove(OTHER, "m1")).rejects.toBeInstanceOf(ForbiddenError);
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("quem tem MANAGE_MESSAGES apaga mensagem de qualquer um (moderação)", async () => {
    findMessageById.mockResolvedValue(messageRow);
    requireChannelAccess.mockResolvedValue({
      ...textChannel,
      context: { permissions: new Set(["VIEW_CHANNEL", "MANAGE_MESSAGES"]) },
    });

    await messageService.remove(OTHER, "m1");
    expect(softDelete).toHaveBeenCalledWith("m1");
  });
});

describe("o selo de menção nos canais que ninguém abriu", () => {
  const SERVER = "6a8781db7415b08f427be100";
  const NEVER_ISOPEN = "6a8781db7415b08f427be101";
  const ALREADY_READ = "6a8781db7415b08f427be102";
  const JOINED_AT = new Date("2026-08-01T12:00:00Z");

  beforeEach(() => {
    readingStates.mockResolvedValue([]);
    participations.mockResolvedValue([
      { guildId: SERVER, roleIds: [ROLE_MENTIONABLE], joinedAt: JOINED_AT },
    ]);
    channelsListen.mockResolvedValue([NEVER_ISOPEN]);
    channelsById.mockResolvedValue([
      { id: NEVER_ISOPEN, guildId: SERVER, name: "geral" },
    ]);
    mentionsSince.mockResolvedValue(new Map([[NEVER_ISOPEN, 2]]));
  });

  it("conta menção em canal sem estado de leitura nenhum", async () => {
    const states = await messageService.readStates(AUTHOR);

    expect(states).toEqual([
      {
        channelId: NEVER_ISOPEN,
        guildId: SERVER,
        channelName: "geral",
        lastReadMessageId: null,
        unreadCount: 0,
        mentionCount: 2,
      },
    ]);
  });

  it("procura a partir da data de entrada no servidor, e com os cargos de quem pergunta", async () => {
    await messageService.readStates(AUTHOR);

    expect(mentionsSince).toHaveBeenCalledWith(
      [NEVER_ISOPEN],
      JOINED_AT,
      AUTHOR,
      [ROLE_MENTIONABLE],
    );
  });

  it("não conta duas vezes o canal que já tem estado", async () => {
    readingStates.mockResolvedValue([
      { channelId: ALREADY_READ, lastReadMessageId: null },
    ]);
    channelsListen.mockResolvedValue([ALREADY_READ, NEVER_ISOPEN]);
    channelsById.mockResolvedValue([{ id: NEVER_ISOPEN, guildId: SERVER, name: "geral" }]);

    await messageService.readStates(AUTHOR);

    expect(mentionsSince).toHaveBeenCalledWith([NEVER_ISOPEN], JOINED_AT, AUTHOR, [
      ROLE_MENTIONABLE,
    ]);
  });

  it("não olha canal que a pessoa não pode ver", async () => {
    channelsListen.mockResolvedValue([]);

    expect(await messageService.readStates(AUTHOR)).toEqual([]);
    expect(mentionsSince).not.toHaveBeenCalled();
  });

  it("não vai ao banco quando a pessoa não está em servidor nenhum", async () => {
    participations.mockResolvedValue([]);

    expect(await messageService.readStates(AUTHOR)).toEqual([]);
    expect(channelsListen).not.toHaveBeenCalled();
  });
});

describe("remover um anexo", () => {
  const withAttachments = {
    ...messageRow,
    content: "olha o arquivo",
    attachments: [
      { id: "a1", url: "u1", filename: "um.txt", contentType: "text/plain", size: 10 },
      { id: "a2", url: "u2", filename: "dois.txt", contentType: "text/plain", size: 20 },
    ],
  };

  it("tira so o anexo pedido e mantem os outros", async () => {
    findMessageById.mockResolvedValue(withAttachments);
    withRelations.mockResolvedValue({ ...withAttachments, attachments: [withAttachments.attachments[1]] });

    const r = await messageService.removeAttachment(AUTHOR, "m1", "a1");

    expect(r.deletedMessage).toBe(false);
    expect(updateMessage).toHaveBeenCalledWith("m1", {
      attachments: { set: [withAttachments.attachments[1]] },
    });
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("apaga a mensagem quando o anexo era a unica coisa nela", async () => {
    findMessageById.mockResolvedValue({
      ...withAttachments,
      content: "",
      attachments: [withAttachments.attachments[0]],
    });

    const r = await messageService.removeAttachment(AUTHOR, "m1", "a1");

    expect(r.deletedMessage).toBe(true);
    expect(softDelete).toHaveBeenCalledWith("m1");
  });

  it("nao apaga a mensagem se ainda sobra texto", async () => {
    findMessageById.mockResolvedValue({
      ...withAttachments,
      attachments: [withAttachments.attachments[0]],
    });
    withRelations.mockResolvedValue({ ...withAttachments, attachments: [] });

    const r = await messageService.removeAttachment(AUTHOR, "m1", "a1");

    expect(r.deletedMessage).toBe(false);
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("membro comum nao mexe no anexo dos outros", async () => {
    findMessageById.mockResolvedValue(withAttachments);

    await expect(messageService.removeAttachment(OTHER, "m1", "a1")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(updateMessage).not.toHaveBeenCalled();
  });

  it("anexo que nao existe na mensagem da NotFound", async () => {
    findMessageById.mockResolvedValue(withAttachments);

    await expect(messageService.removeAttachment(AUTHOR, "m1", "a9")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
