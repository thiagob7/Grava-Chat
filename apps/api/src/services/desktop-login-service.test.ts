import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

import { UnauthorizedError } from "~/lib/http.js";

const set = vi.fn();
const getdel = vi.fn();

vi.mock("~/lib/redis.js", () => ({
  redis: {
    set: (...a: unknown[]) => set(...a),
    getdel: (...a: unknown[]) => getdel(...a),
  },
  keys: { desktopLogin: (codigo: string) => `desktop-login:${codigo}` },
}));

const { desktopLoginService } = await import("~/services/desktop-login-service.js");

const hash = (valor: string) => createHash("sha256").update(valor).digest("base64url");

describe("desktopLoginService", () => {
  beforeEach(() => {
    set.mockReset();
    getdel.mockReset();
  });

  it("guarda o código com validade curta e devolve o dono na troca", async () => {
    const verificador = desktopLoginService.novoDesafio();
    const codigo = await desktopLoginService.emitirCodigo("user-1", hash(verificador));

    expect(set).toHaveBeenCalledWith(
      `desktop-login:${codigo}`,
      JSON.stringify({ userId: "user-1", desafio: hash(verificador) }),
      "EX",
      120,
    );

    getdel.mockResolvedValue(JSON.stringify({ userId: "user-1", desafio: hash(verificador) }));
    await expect(desktopLoginService.resgatar(codigo, verificador)).resolves.toBe("user-1");
  });

  it("recusa o código sem o verificador certo", async () => {
    getdel.mockResolvedValue(JSON.stringify({ userId: "user-1", desafio: hash("o-certo") }));

    await expect(desktopLoginService.resgatar("codigo", "o-errado")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("recusa código já usado ou expirado", async () => {
    getdel.mockResolvedValue(null);

    await expect(desktopLoginService.resgatar("codigo", "verificador")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
