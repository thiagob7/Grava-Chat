import { beforeEach, describe, expect, it, vi } from "vitest";

const ligado = vi.fn();
const enviar = vi.fn();
const set = vi.fn();
const getdel = vi.fn();
const del = vi.fn();
const acharPorEmail = vi.fn();
const acharPorId = vi.fn();
const atualizar = vi.fn();
const contasDe = vi.fn();
const criarConta = vi.fn();
const derrubarSessoes = vi.fn();

vi.mock("~/env.js", () => ({ env: { WEB_ORIGIN: "https://gravae.chat,https://outro" } }));

vi.mock("~/lib/correio.js", () => ({
  correio: { ligado: () => ligado(), enviar: (...a: unknown[]) => enviar(...a) },
}));

vi.mock("~/lib/senha.js", () => ({ gerarHash: async (s: string) => `hash(${s})` }));

vi.mock("~/lib/redis.js", () => ({
  redis: {
    set: (...a: unknown[]) => set(...a),
    getdel: (...a: unknown[]) => getdel(...a),
    del: (...a: unknown[]) => del(...a),
  },
  keys: {
    redefinicaoDeSenha: (t: string) => `senha:redefinir:${t}`,
    pedidoDeRedefinicao: (u: string) => `senha:pedido:${u}`,
  },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findByEmail: (...a: unknown[]) => acharPorEmail(...a),
    findById: (...a: unknown[]) => acharPorId(...a),
    update: (...a: unknown[]) => atualizar(...a),
  },
}));

vi.mock("~/repositories/account-repository.js", () => ({
  accountRepository: {
    findManyByUser: (...a: unknown[]) => contasDe(...a),
    create: (...a: unknown[]) => criarConta(...a),
  },
}));

vi.mock("~/repositories/session-repository.js", () => ({
  sessionRepository: { revokeAllForUser: (...a: unknown[]) => derrubarSessoes(...a) },
}));

const { redefinicaoService, textoDoEmail } = await import("~/services/redefinicao-service.js");

const pessoa = (extras = {}) => ({
  id: "u1",
  email: "quem@exemplo.com",
  displayName: "Quem",
  isBot: false,
  sistema: false,
  ...extras,
});

const linkEnviado = () => {
  const [, , texto] = enviar.mock.calls[0] as [string, string, string];
  return /https:\/\/\S+/.exec(texto)![0];
};

const tokenEnviado = () => new URL(linkEnviado()).searchParams.get("token")!;

const chaveGuardada = () => (set.mock.calls.find((c) => String(c[0]).startsWith("senha:redefinir:"))![0]) as string;

beforeEach(() => {
  vi.clearAllMocks();
  ligado.mockReturnValue(true);
  acharPorEmail.mockResolvedValue(pessoa());
  acharPorId.mockResolvedValue(pessoa());
  contasDe.mockResolvedValue([]);
  set.mockResolvedValue("OK");
});

describe("pedir uma senha nova", () => {
  it("recusa quando o servidor não tem correio", async () => {
    ligado.mockReturnValue(false);

    await expect(redefinicaoService.pedir("quem@exemplo.com")).rejects.toThrow("não está configurado");
  });

  it("não conta que o e-mail não existe", async () => {
    acharPorEmail.mockResolvedValue(null);

    await expect(redefinicaoService.pedir("ninguem@exemplo.com")).resolves.toBeUndefined();
    expect(enviar).not.toHaveBeenCalled();
  });

  it("não manda para bot nem para a conta da casa", async () => {
    for (const quem of [pessoa({ isBot: true }), pessoa({ sistema: true })]) {
      vi.clearAllMocks();
      ligado.mockReturnValue(true);
      set.mockResolvedValue("OK");
      acharPorEmail.mockResolvedValue(quem);

      await redefinicaoService.pedir("quem@exemplo.com");
      expect(enviar).not.toHaveBeenCalled();
    }
  });

  it("segura o segundo pedido seguido da mesma conta", async () => {
    set.mockResolvedValueOnce(null);

    await redefinicaoService.pedir("quem@exemplo.com");

    expect(enviar).not.toHaveBeenCalled();
  });

  it("manda o link com o token, na primeira origem", async () => {
    await redefinicaoService.pedir("QUEM@Exemplo.com ");

    expect(acharPorEmail).toHaveBeenCalledWith("quem@exemplo.com");
    expect(linkEnviado()).toMatch(/^https:\/\/gravae\.chat\/redefinir\?token=/);
  });

  it("guarda o resumo do token, e não o token", async () => {
    await redefinicaoService.pedir("quem@exemplo.com");

    expect(chaveGuardada()).not.toContain(tokenEnviado());
    expect(set).toHaveBeenCalledWith(chaveGuardada(), "u1", "EX", 30 * 60);
  });
});

describe("redefinir com o token", () => {
  it("recusa token que já foi usado ou venceu", async () => {
    getdel.mockResolvedValue(null);

    await expect(redefinicaoService.redefinir("t", "senha-nova")).rejects.toThrow("já foi usado");
    expect(atualizar).not.toHaveBeenCalled();
  });

  it("recusa quando a conta sumiu no meio do caminho", async () => {
    getdel.mockResolvedValue("u1");
    acharPorId.mockResolvedValue(null);

    await expect(redefinicaoService.redefinir("t", "senha-nova")).rejects.toThrow("já foi usado");
  });

  it("guarda a senha nova e derruba toda sessão aberta", async () => {
    getdel.mockResolvedValue("u1");

    await redefinicaoService.redefinir("t", "senha-nova");

    expect(atualizar).toHaveBeenCalledWith("u1", { senhaHash: "hash(senha-nova)" });
    expect(derrubarSessoes).toHaveBeenCalledWith("u1");
  });

  it("dá conta de senha a quem só entrava pelo Google", async () => {
    getdel.mockResolvedValue("u1");
    contasDe.mockResolvedValue([{ provider: "google" }]);

    await redefinicaoService.redefinir("t", "senha-nova");

    expect(criarConta).toHaveBeenCalledWith({
      userId: "u1",
      provider: "senha",
      providerAccountId: "quem@exemplo.com",
    });
  });

  it("não duplica a conta de senha de quem já tinha", async () => {
    getdel.mockResolvedValue("u1");
    contasDe.mockResolvedValue([{ provider: "senha" }]);

    await redefinicaoService.redefinir("t", "senha-nova");

    expect(criarConta).not.toHaveBeenCalled();
  });
});

describe("o texto do e-mail", () => {
  it("chama pelo nome e leva o link inteiro", () => {
    const texto = textoDoEmail("Quem", "https://gravae.chat/redefinir?token=abc");

    expect(texto).toContain("Oi, Quem.");
    expect(texto).toContain("https://gravae.chat/redefinir?token=abc");
    expect(texto).toContain("30 minutos");
  });
});
