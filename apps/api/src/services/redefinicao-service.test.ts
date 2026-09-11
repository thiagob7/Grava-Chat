import { beforeEach, describe, expect, it, vi } from "vitest";

const on = vi.fn();
const send = vi.fn();
const set = vi.fn();
const getdel = vi.fn();
const del = vi.fn();
const findByEmail = vi.fn();
const findById = vi.fn();
const update = vi.fn();
const accounts = vi.fn();
const createAccount = vi.fn();
const dropSessions = vi.fn();

vi.mock("~/env.js", () => ({
  env: { WEB_ORIGIN: "https://gravae.chat,https://outro" },
  isDev: false,
}));

vi.mock("~/services/oficial-service.js", () => ({
  officialService: { notify: vi.fn() },
}));

vi.mock("~/lib/correio.js", () => ({
  mail: { on: () => on(), send: (...a: unknown[]) => send(...a) },
}));

vi.mock("~/lib/senha.js", () => ({ generateHash: async (s: string) => `hash(${s})` }));

vi.mock("~/lib/redis.js", () => ({
  redis: {
    set: (...a: unknown[]) => set(...a),
    getdel: (...a: unknown[]) => getdel(...a),
    del: (...a: unknown[]) => del(...a),
  },
  keys: {
    passwordReset: (t: string) => `senha:redefinir:${t}`,
    resetRequest: (u: string) => `senha:pedido:${u}`,
  },
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findByEmail: (...a: unknown[]) => findByEmail(...a),
    findById: (...a: unknown[]) => findById(...a),
    update: (...a: unknown[]) => update(...a),
  },
}));

vi.mock("~/repositories/account-repository.js", () => ({
  accountRepository: {
    findManyByUser: (...a: unknown[]) => accounts(...a),
    create: (...a: unknown[]) => createAccount(...a),
  },
}));

vi.mock("~/repositories/session-repository.js", () => ({
  sessionRepository: { revokeAllForUser: (...a: unknown[]) => dropSessions(...a) },
}));

const { resetService, emailText } = await import("~/services/redefinicao-service.js");

const person = (extras = {}) => ({
  id: "u1",
  email: "quem@exemplo.com",
  displayName: "Quem",
  isBot: false,
  system: false,
  ...extras,
});

const linkSent = () => {
  const [, , text] = send.mock.calls[0] as [string, string, string];
  return /https:\/\/\S+/.exec(text)![0];
};

const tokenSent = () => new URL(linkSent()).searchParams.get("token")!;

const keyStored = () => (set.mock.calls.find((c) => String(c[0]).startsWith("senha:redefinir:"))![0]) as string;

beforeEach(() => {
  vi.clearAllMocks();
  on.mockReturnValue(true);
  findByEmail.mockResolvedValue(person());
  findById.mockResolvedValue(person());
  accounts.mockResolvedValue([]);
  set.mockResolvedValue("OK");
});

describe("pedir uma senha nova", () => {
  it("recusa quando o servidor não tem correio", async () => {
    on.mockReturnValue(false);

    await expect(resetService.askFor("quem@exemplo.com")).rejects.toThrow("não está configurado");
  });

  it("não conta que o e-mail não existe", async () => {
    findByEmail.mockResolvedValue(null);

    await expect(resetService.askFor("ninguem@exemplo.com")).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });

  it("não manda para bot nem para a conta da casa", async () => {
    for (const who of [person({ isBot: true }), person({ system: true })]) {
      vi.clearAllMocks();
      on.mockReturnValue(true);
      set.mockResolvedValue("OK");
      findByEmail.mockResolvedValue(who);

      await resetService.askFor("quem@exemplo.com");
      expect(send).not.toHaveBeenCalled();
    }
  });

  it("segura o segundo pedido seguido da mesma conta", async () => {
    set.mockResolvedValueOnce(null);

    await resetService.askFor("quem@exemplo.com");

    expect(send).not.toHaveBeenCalled();
  });

  it("manda o link com o token, na primeira origem", async () => {
    await resetService.askFor("QUEM@Exemplo.com ");

    expect(findByEmail).toHaveBeenCalledWith("quem@exemplo.com");
    expect(linkSent()).toMatch(/^https:\/\/gravae\.chat\/redefinir\?token=/);
  });

  it("guarda o resumo do token, e não o token", async () => {
    await resetService.askFor("quem@exemplo.com");

    expect(keyStored()).not.toContain(tokenSent());
    expect(set).toHaveBeenCalledWith(keyStored(), "u1", "EX", 30 * 60);
  });
});

describe("redefinir com o token", () => {
  it("recusa token que já foi usado ou venceu", async () => {
    getdel.mockResolvedValue(null);

    await expect(resetService.reset("t", "senha-nova")).rejects.toThrow("já foi usado");
    expect(update).not.toHaveBeenCalled();
  });

  it("recusa quando a conta sumiu no meio do caminho", async () => {
    getdel.mockResolvedValue("u1");
    findById.mockResolvedValue(null);

    await expect(resetService.reset("t", "senha-nova")).rejects.toThrow("já foi usado");
  });

  it("guarda a senha nova e derruba toda sessão aberta", async () => {
    getdel.mockResolvedValue("u1");

    await resetService.reset("t", "senha-nova");

    expect(update).toHaveBeenCalledWith("u1", { passwordHash: "hash(senha-nova)" });
    expect(dropSessions).toHaveBeenCalledWith("u1");
  });

  it("dá conta de senha a quem só entrava pelo Google", async () => {
    getdel.mockResolvedValue("u1");
    accounts.mockResolvedValue([{ provider: "google" }]);

    await resetService.reset("t", "senha-nova");

    expect(createAccount).toHaveBeenCalledWith({
      userId: "u1",
      provider: "senha",
      providerAccountId: "quem@exemplo.com",
    });
  });

  it("não duplica a conta de senha de quem já tinha", async () => {
    getdel.mockResolvedValue("u1");
    accounts.mockResolvedValue([{ provider: "senha" }]);

    await resetService.reset("t", "senha-nova");

    expect(createAccount).not.toHaveBeenCalled();
  });
});

describe("o texto do e-mail", () => {
  it("chama pelo nome e leva o link inteiro", () => {
    const text = emailText("Quem", "https://gravae.chat/redefinir?token=abc");

    expect(text).toContain("Oi, Quem.");
    expect(text).toContain("https://gravae.chat/redefinir?token=abc");
    expect(text).toContain("30 minutos");
  });
});
