import { beforeEach, describe, expect, it, vi } from "vitest";

const criarDenuncia = vi.fn();
const acharMensagem = vi.fn();
const acessoAoCanal = vi.fn();
const acharUsuario = vi.fn();
const acharDm = vi.fn();
const criarDm = vi.fn();
const enviar = vi.fn();

vi.mock("~/lib/prisma.js", () => ({
  prisma: { denuncia: { create: (...a: unknown[]) => criarDenuncia(...a) } },
}));

vi.mock("~/lib/serialize.js", () => ({ ADMINS: ["chefe@gravae.io"] }));

vi.mock("~/env.js", () => ({ env: { WEB_ORIGIN: "https://gravae.chat,https://outro" } }));

vi.mock("~/realtime/difusao.js", () => ({ enviarMensagem: (...a: unknown[]) => enviar(...a) }));

vi.mock("~/repositories/friendship-repository.js", () => ({
  dmRepository: {
    findBetween: (...a: unknown[]) => acharDm(...a),
    create: (...a: unknown[]) => criarDm(...a),
  },
}));

vi.mock("~/repositories/guild-repository.js", () => ({
  guildRepository: { findByIdOrThrow: async (id: string) => ({ id, name: "Casa" }) },
}));

vi.mock("~/repositories/message-repository.js", () => ({
  messageRepository: { findById: (...a: unknown[]) => acharMensagem(...a) },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findByIdOrThrow: (...a: unknown[]) => acharUsuario(...a),
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
