import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError } from "~/lib/http.js";

const findMessageById = vi.fn();
const softDelete = vi.fn();
const updateMessage = vi.fn();
const createMessage = vi.fn();
const markRead = vi.fn();
const requireChannelAccess = vi.fn();

/**
 * Sem estes mocks o service falaria com o Mongo de verdade. É exatamente isso
 * que a separação repository/service compra: dá pra testar a REGRA sem banco,
 * sem servidor e em milissegundos.
 */
vi.mock("~/repositories/message-repository.js", () => ({
  messageRepository: {
    findById: (...a: unknown[]) => findMessageById(...a),
    softDelete: (...a: unknown[]) => softDelete(...a),
    update: (...a: unknown[]) => updateMessage(...a),
    create: (...a: unknown[]) => createMessage(...a),
  },
  reactionRepository: { findManyByMessage: vi.fn(), add: vi.fn(), remove: vi.fn() },
  readStateRepository: { markRead: (...a: unknown[]) => markRead(...a), findManyByUser: vi.fn() },
}));

vi.mock("~/services/access-service.js", () => ({
  accessService: { requireChannelAccess: (...a: unknown[]) => requireChannelAccess(...a) },
}));

/**
 * O service passou a conhecer canal, expressões, automod e fórum. Nenhum deles
 * participa das regras testadas aqui — mockar mantém o teste sem banco, sem
 * Redis e em milissegundos.
 */
vi.mock("~/repositories/guild-repository.js", () => ({
  channelRepository: { findById: vi.fn() },
  memberRepository: { find: vi.fn() },
  guildRepository: { findById: vi.fn() },
  categoryRepository: {},
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
  redis: { set: vi.fn(), ttl: vi.fn() },
  keys: { slowmode: () => "slow:teste" },
}));

const { messageService } = await import("~/services/message-service.js");

const AUTHOR = "6a8781da7415b08f427be1a4";
const OUTRO = "6a8781f57415b08f427be1ad";
const CHANNEL = "6a8781db7415b08f427be1aa";

/** Contexto de quem é membro comum: vê e escreve, mas não modera. */
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

beforeEach(() => {
  vi.clearAllMocks();
  requireChannelAccess.mockResolvedValue(textChannel);
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
