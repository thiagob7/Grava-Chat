import { beforeEach, describe, expect, it, vi } from "vitest";

const createReport = vi.fn();
const listReports = vi.fn();
const findReport = vi.fn();
const updateReport = vi.fn();
const folksByIds = vi.fn();
const serversByIds = vi.fn();
const findMessage = vi.fn();
const accessChannel = vi.fn();
const findUser = vi.fn();
const findDm = vi.fn();
const createDm = vi.fn();
const send = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    report: {
      create: (...a: unknown[]) => createReport(...a),
      findMany: (...a: unknown[]) => listReports(...a),
      findUnique: (...a: unknown[]) => findReport(...a),
      update: (...a: unknown[]) => updateReport(...a),
    },
  },
}));

vi.mock("~/lib/serialize.js", () => ({ ADMINS: ["chefe@exemplo.com"] }));

vi.mock("~/env.js", () => ({ env: { WEB_ORIGIN: "https://gravae.chat,https://outro" } }));

vi.mock("~/realtime/difusao.js", () => ({ sendMessage: (...a: unknown[]) => send(...a) }));

vi.mock("~/repositories/friendship-repository.js", () => ({
  dmRepository: {
    findBetween: (...a: unknown[]) => findDm(...a),
    create: (...a: unknown[]) => createDm(...a),
  },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  guildRepository: {
    findByIdOrThrow: async (id: string) => ({ id, name: "Casa" }),
    findManyByIds: (...a: unknown[]) => serversByIds(...a),
  },
}));

vi.mock("~/repositories/message-repository.js", () => ({
  messageRepository: { findById: (...a: unknown[]) => findMessage(...a) },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findByIdOrThrow: (...a: unknown[]) => findUser(...a),
    findManyByIds: (...a: unknown[]) => folksByIds(...a),
    findByEmail: async () => ({ id: "admin", username: "chefe" }),
  },
}));

vi.mock("~/services/access-service.js", () => ({
  accessService: { requireChannelAccess: (...a: unknown[]) => accessChannel(...a) },
}));

vi.mock("~/services/sistema-service.js", () => ({
  systemService: { user: async () => ({ id: "casa" }) },
}));

const { reportService } = await import("~/services/denuncia-service.js");

const message = (extras = {}) => ({
  id: "m1",
  channelId: "c1",
  authorId: "reu",
  content: "olha o golpe",
  deletedAt: null,
  ...extras,
});

const channel = (extras = {}) => ({ id: "c1", name: "geral", guildId: "g1", ...extras });

beforeEach(() => {
  vi.clearAllMocks();
  createReport.mockResolvedValue({ id: "d1" });
  findMessage.mockResolvedValue(message());
  accessChannel.mockResolvedValue({ channel: channel() });
  findDm.mockResolvedValue({ id: "dm" });
  findUser.mockImplementation(async (id: string) => ({ id, username: id }));
  folksByIds.mockResolvedValue([]);
  serversByIds.mockResolvedValue([]);
  listReports.mockResolvedValue([]);
});

describe("denúncia de mensagem", () => {
  it("não aceita mensagem apagada", async () => {
    findMessage.mockResolvedValue(message({ deletedAt: new Date() }));

    await expect(reportService.reportMessage("quem", "m1", { reason: "spam" })).rejects.toThrow(
      "Mensagem não encontrada",
    );
    expect(createReport).not.toHaveBeenCalled();
  });

  it("não deixa denunciar a própria mensagem", async () => {
    await expect(reportService.reportMessage("reu", "m1", { reason: "spam" })).rejects.toThrow(
      "própria mensagem",
    );
  });

  it("não deixa denunciar a conta da casa", async () => {
    findMessage.mockResolvedValue(message({ authorId: "casa" }));

    await expect(reportService.reportMessage("quem", "m1", { reason: "spam" })).rejects.toThrow(
      "conta do sistema",
    );
  });

  it("guarda o texto no registro, porque a mensagem pode sumir depois", async () => {
    await reportService.reportMessage("quem", "m1", { reason: "golpe", details: "vende curso" });

    expect(createReport).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: "mensagem",
        guildId: "g1",
        channelId: "c1",
        messageId: "m1",
        accusedId: "reu",
        snippet: "olha o golpe",
        authorId: "quem",
        reason: "golpe",
        details: "vende curso",
      }),
    });
  });

  it("corta o texto longo em 300", async () => {
    findMessage.mockResolvedValue(message({ content: "a".repeat(500) }));

    await reportService.reportMessage("quem", "m1", { reason: "spam" });

    const { data } = createReport.mock.calls[0]![0] as { data: { snippet: string } };
    expect(data.snippet).toHaveLength(300);
  });

  it("avisa quem administra com o link da mensagem", async () => {
    await reportService.reportMessage("quem", "m1", { reason: "spam" });

    const [author, { channelId, content }] = send.mock.calls[0] as [string, { channelId: string; content: string }];

    expect(author).toBe("casa");
    expect(channelId).toBe("dm");
    expect(content).toContain("Casa › #geral");
    expect(content).toContain("https://gravae.chat/channels/g1/c1/m1");
  });

  it("na conversa privada, diz que é privada e usa @me no link", async () => {
    accessChannel.mockResolvedValue({ channel: channel({ guildId: null, name: null }) });

    await reportService.reportMessage("quem", "m1", { reason: "assedio" });

    const [, { content }] = send.mock.calls[0] as [string, { content: string }];

    expect(content).toContain("conversa privada");
    expect(content).toContain("/channels/@me/c1/m1");
  });

  it("administrador que não recebe não derruba a denúncia", async () => {
    send.mockRejectedValue(new Error("dm fechada"));

    expect(await reportService.reportMessage("quem", "m1", { reason: "outro" })).toEqual({ id: "d1" });
  });
});

const kept = (extras = {}) => ({
  id: "d1",
  kind: "mensagem",
  guildId: "g1",
  channelId: "c1",
  messageId: "m1",
  accusedId: "reu",
  snippet: "olha o golpe",
  authorId: "quem",
  reason: "golpe",
  details: null,
  resolvedAt: null,
  resolvedBy: null,
  decision: null,
  createdAt: new Date("2026-09-08T12:00:00Z"),
  ...extras,
});

describe("a fila da administração", () => {
  it("por padrão traz tudo; com o filtro, só o que não teve desfecho", async () => {
    await reportService.list();
    expect(listReports.mock.calls[0]![0]).toMatchObject({ where: {} });

    await reportService.list({ pending: true });
    expect(listReports.mock.calls[1]![0]).toMatchObject({ where: { resolvedAt: null } });
  });

  it("resolve o alvo: nome da comunidade e quem escreveu", async () => {
    listReports.mockResolvedValue([kept()]);
    folksByIds.mockResolvedValue([
      { id: "quem", username: "quem", displayName: "Quem" },
      { id: "reu", username: "reu", displayName: "Réu" },
    ]);
    serversByIds.mockResolvedValue([{ id: "g1", name: "Casa" }]);

    const { items } = await reportService.list();

    expect(items[0]).toMatchObject({
      kind: "mensagem",
      reasonWritten: "Golpe ou fraude",
      author: { username: "quem" },
      community: { name: "Casa" },
      message: { snippet: "olha o golpe", author: { username: "reu" } },
    });
  });

  it("aguenta conta apagada sem quebrar a linha", async () => {
    listReports.mockResolvedValue([kept()]);

    const { items } = await reportService.list();

    expect(items[0]!.author).toBeNull();
    expect(items[0]!.message!.author).toBeNull();
  });

  it("denúncia velha, sem tipo, é de comunidade", async () => {
    listReports.mockResolvedValue([kept({ kind: null, messageId: null, channelId: null })]);

    const { items } = await reportService.list();

    expect(items[0]!.kind).toBe("comunidade");
    expect(items[0]!.message).toBeNull();
  });

  it("só diz que há próxima página quando veio uma a mais", async () => {
    listReports.mockResolvedValue([kept({ id: "d1" }), kept({ id: "d2" })]);

    const { items, next } = await reportService.list({ limit: 1 });

    expect(items).toHaveLength(1);
    expect(next).toBe("d1");

    listReports.mockResolvedValue([kept({ id: "d1" })]);
    expect((await reportService.list({ limit: 1 })).next).toBeNull();
  });
});

describe("dar desfecho", () => {
  it("recusa denúncia que não existe", async () => {
    findReport.mockResolvedValue(null);

    await expect(reportService.resolve("admin", "d1", "procede")).rejects.toThrow("não encontrada");
    expect(updateReport).not.toHaveBeenCalled();
  });

  it("registra quem olhou e o que concluiu", async () => {
    findReport.mockResolvedValue(kept());

    await reportService.resolve("admin", "d1", "arquivada");

    expect(updateReport).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: expect.objectContaining({ resolvedBy: "admin", decision: "arquivada" }),
    });
  });

  it("reabrir devolve a denúncia para a fila", async () => {
    await reportService.reopen("d1");

    expect(updateReport).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { resolvedAt: null, resolvedBy: null, decision: null },
    });
  });
});
