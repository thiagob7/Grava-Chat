import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, NotFoundError } from "~/lib/http.js";

const findMessageById = vi.fn();
const softDelete = vi.fn();
const updateMessage = vi.fn();
const createMessage = vi.fn();
const markRead = vi.fn();
const requireChannelAccess = vi.fn();

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

vi.mock("~/repositories/guild-repository.js", () => ({
  channelRepository: { findById: vi.fn() },
  memberRepository: { find: vi.fn() },
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

/*
  O mock do Redis envelheceu escondido.

  Ele cobria só o modo lento; depois entrou o controle de vazão
  (`fluxoDeMensagens`, com `incr` e `expire`) e ninguém atualizou aqui — porque
  o arquivo inteiro nunca chegava a rodar: o `env.ts` matava o processo na
  importação, e o vitest só sabia dizer "falhou ao carregar".

  `incr` devolve 1 de propósito: é o primeiro uso da janela, o caso em que a
  vazão deixa passar. Um teste de mensagem não deve morrer por limite de taxa.
*/
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
