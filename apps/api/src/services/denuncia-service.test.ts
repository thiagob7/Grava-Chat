import { beforeEach, describe, expect, it, vi } from "vitest";

const criarDenuncia = vi.fn();
const listarDenuncias = vi.fn();
const acharDenuncia = vi.fn();
const atualizarDenuncia = vi.fn();
const gentePorIds = vi.fn();
const servidoresPorIds = vi.fn();
const acharMensagem = vi.fn();
const acessoAoCanal = vi.fn();
const acharUsuario = vi.fn();
const acharDm = vi.fn();
const criarDm = vi.fn();
const enviar = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: {
    denuncia: {
      create: (...a: unknown[]) => criarDenuncia(...a),
      findMany: (...a: unknown[]) => listarDenuncias(...a),
      findUnique: (...a: unknown[]) => acharDenuncia(...a),
      update: (...a: unknown[]) => atualizarDenuncia(...a),
    },
  },
}));

vi.mock("~/lib/serialize.js", () => ({ ADMINS: ["chefe@exemplo.com"] }));

vi.mock("~/env.js", () => ({ env: { WEB_ORIGIN: "https://gravae.chat,https://outro" } }));

vi.mock("~/realtime/difusao.js", () => ({ enviarMensagem: (...a: unknown[]) => enviar(...a) }));

vi.mock("~/repositories/friendship-repository.js", () => ({
  dmRepository: {
    findBetween: (...a: unknown[]) => acharDm(...a),
    create: (...a: unknown[]) => criarDm(...a),
  },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  guildRepository: {
    findByIdOrThrow: async (id: string) => ({ id, name: "Casa" }),
    findManyByIds: (...a: unknown[]) => servidoresPorIds(...a),
  },
}));

vi.mock("~/repositories/message-repository.js", () => ({
  messageRepository: { findById: (...a: unknown[]) => acharMensagem(...a) },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findByIdOrThrow: (...a: unknown[]) => acharUsuario(...a),
    findManyByIds: (...a: unknown[]) => gentePorIds(...a),
    findByEmail: async () => ({ id: "admin", username: "chefe" }),
  },
}));

vi.mock("~/services/access-service.js", () => ({
  accessService: { requireChannelAccess: (...a: unknown[]) => acessoAoCanal(...a) },
}));

vi.mock("~/services/sistema-service.js", () => ({
  sistemaService: { usuario: async () => ({ id: "casa" }) },
}));

const { denunciaService } = await import("~/services/denuncia-service.js");

const mensagem = (extras = {}) => ({
  id: "m1",
  channelId: "c1",
  authorId: "reu",
  content: "olha o golpe",
  deletedAt: null,
  ...extras,
});

const canal = (extras = {}) => ({ id: "c1", name: "geral", guildId: "g1", ...extras });

beforeEach(() => {
  vi.clearAllMocks();
  criarDenuncia.mockResolvedValue({ id: "d1" });
  acharMensagem.mockResolvedValue(mensagem());
  acessoAoCanal.mockResolvedValue({ channel: canal() });
  acharDm.mockResolvedValue({ id: "dm" });
  acharUsuario.mockImplementation(async (id: string) => ({ id, username: id }));
  gentePorIds.mockResolvedValue([]);
  servidoresPorIds.mockResolvedValue([]);
  listarDenuncias.mockResolvedValue([]);
});

describe("denúncia de mensagem", () => {
  it("não aceita mensagem apagada", async () => {
    acharMensagem.mockResolvedValue(mensagem({ deletedAt: new Date() }));

    await expect(denunciaService.denunciarMensagem("quem", "m1", { motivo: "spam" })).rejects.toThrow(
      "Mensagem não encontrada",
    );
    expect(criarDenuncia).not.toHaveBeenCalled();
  });

  it("não deixa denunciar a própria mensagem", async () => {
    await expect(denunciaService.denunciarMensagem("reu", "m1", { motivo: "spam" })).rejects.toThrow(
      "própria mensagem",
    );
  });

  it("não deixa denunciar a conta da casa", async () => {
    acharMensagem.mockResolvedValue(mensagem({ authorId: "casa" }));

    await expect(denunciaService.denunciarMensagem("quem", "m1", { motivo: "spam" })).rejects.toThrow(
      "conta do sistema",
    );
  });

  it("guarda o texto no registro, porque a mensagem pode sumir depois", async () => {
    await denunciaService.denunciarMensagem("quem", "m1", { motivo: "golpe", detalhes: "vende curso" });

    expect(criarDenuncia).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipo: "mensagem",
        guildId: "g1",
        channelId: "c1",
        messageId: "m1",
        acusadoId: "reu",
        trecho: "olha o golpe",
        autorId: "quem",
        motivo: "golpe",
        detalhes: "vende curso",
      }),
    });
  });

  it("corta o texto longo em 300", async () => {
    acharMensagem.mockResolvedValue(mensagem({ content: "a".repeat(500) }));

    await denunciaService.denunciarMensagem("quem", "m1", { motivo: "spam" });

    const { data } = criarDenuncia.mock.calls[0]![0] as { data: { trecho: string } };
    expect(data.trecho).toHaveLength(300);
  });

  it("avisa quem administra com o link da mensagem", async () => {
    await denunciaService.denunciarMensagem("quem", "m1", { motivo: "spam" });

    const [autor, { channelId, content }] = enviar.mock.calls[0] as [string, { channelId: string; content: string }];

    expect(autor).toBe("casa");
    expect(channelId).toBe("dm");
    expect(content).toContain("Casa › #geral");
    expect(content).toContain("https://gravae.chat/channels/g1/c1/m1");
  });

  it("na conversa privada, diz que é privada e usa @me no link", async () => {
    acessoAoCanal.mockResolvedValue({ channel: canal({ guildId: null, name: null }) });

    await denunciaService.denunciarMensagem("quem", "m1", { motivo: "assedio" });

    const [, { content }] = enviar.mock.calls[0] as [string, { content: string }];

    expect(content).toContain("conversa privada");
    expect(content).toContain("/channels/@me/c1/m1");
  });

  it("administrador que não recebe não derruba a denúncia", async () => {
    enviar.mockRejectedValue(new Error("dm fechada"));

    expect(await denunciaService.denunciarMensagem("quem", "m1", { motivo: "outro" })).toEqual({ id: "d1" });
  });
});

const guardada = (extras = {}) => ({
  id: "d1",
  tipo: "mensagem",
  guildId: "g1",
  channelId: "c1",
  messageId: "m1",
  acusadoId: "reu",
  trecho: "olha o golpe",
  autorId: "quem",
  motivo: "golpe",
  detalhes: null,
  resolvidaEm: null,
  resolvidaPor: null,
  decisao: null,
  createdAt: new Date("2026-09-08T12:00:00Z"),
  ...extras,
});

describe("a fila da administração", () => {
  it("por padrão traz tudo; com o filtro, só o que não teve desfecho", async () => {
    await denunciaService.listar();
    expect(listarDenuncias.mock.calls[0]![0]).toMatchObject({ where: {} });

    await denunciaService.listar({ pendentes: true });
    expect(listarDenuncias.mock.calls[1]![0]).toMatchObject({ where: { resolvidaEm: null } });
  });

  it("resolve o alvo: nome da comunidade e quem escreveu", async () => {
    listarDenuncias.mockResolvedValue([guardada()]);
    gentePorIds.mockResolvedValue([
      { id: "quem", username: "quem", displayName: "Quem" },
      { id: "reu", username: "reu", displayName: "Réu" },
    ]);
    servidoresPorIds.mockResolvedValue([{ id: "g1", name: "Casa" }]);

    const { itens } = await denunciaService.listar();

    expect(itens[0]).toMatchObject({
      tipo: "mensagem",
      motivoEscrito: "Golpe ou fraude",
      autor: { username: "quem" },
      comunidade: { nome: "Casa" },
      mensagem: { trecho: "olha o golpe", autor: { username: "reu" } },
    });
  });

  it("aguenta conta apagada sem quebrar a linha", async () => {
    listarDenuncias.mockResolvedValue([guardada()]);

    const { itens } = await denunciaService.listar();

    expect(itens[0]!.autor).toBeNull();
    expect(itens[0]!.mensagem!.autor).toBeNull();
  });

  it("denúncia velha, sem tipo, é de comunidade", async () => {
    listarDenuncias.mockResolvedValue([guardada({ tipo: null, messageId: null, channelId: null })]);

    const { itens } = await denunciaService.listar();

    expect(itens[0]!.tipo).toBe("comunidade");
    expect(itens[0]!.mensagem).toBeNull();
  });

  it("só diz que há próxima página quando veio uma a mais", async () => {
    listarDenuncias.mockResolvedValue([guardada({ id: "d1" }), guardada({ id: "d2" })]);

    const { itens, proxima } = await denunciaService.listar({ limite: 1 });

    expect(itens).toHaveLength(1);
    expect(proxima).toBe("d1");

    listarDenuncias.mockResolvedValue([guardada({ id: "d1" })]);
    expect((await denunciaService.listar({ limite: 1 })).proxima).toBeNull();
  });
});

describe("dar desfecho", () => {
  it("recusa denúncia que não existe", async () => {
    acharDenuncia.mockResolvedValue(null);

    await expect(denunciaService.resolver("admin", "d1", "procede")).rejects.toThrow("não encontrada");
    expect(atualizarDenuncia).not.toHaveBeenCalled();
  });

  it("registra quem olhou e o que concluiu", async () => {
    acharDenuncia.mockResolvedValue(guardada());

    await denunciaService.resolver("admin", "d1", "arquivada");

    expect(atualizarDenuncia).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: expect.objectContaining({ resolvidaPor: "admin", decisao: "arquivada" }),
    });
  });

  it("reabrir devolve a denúncia para a fila", async () => {
    await denunciaService.reabrir("d1");

    expect(atualizarDenuncia).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { resolvidaEm: null, resolvidaPor: null, decisao: null },
    });
  });
});
