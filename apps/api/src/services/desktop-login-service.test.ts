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
  keys: { desktopLogin: (code: string) => `desktop-login:${code}` },
}));

const { desktopLoginService } = await import("~/services/desktop-login-service.js");

const hash = (value: string) => createHash("sha256").update(value).digest("base64url");

describe("desktopLoginService", () => {
  beforeEach(() => {
    set.mockReset();
    getdel.mockReset();
  });

  it("guarda o código com validade curta e devolve o dono na troca", async () => {
    const verifier = desktopLoginService.newChallenge();
    const code = await desktopLoginService.emitCode("user-1", hash(verifier));

    expect(set).toHaveBeenCalledWith(
      `desktop-login:${code}`,
      JSON.stringify({ userId: "user-1", challenge: hash(verifier) }),
      "EX",
      120,
    );

    getdel.mockResolvedValue(JSON.stringify({ userId: "user-1", challenge: hash(verifier) }));
    await expect(desktopLoginService.redeem(code, verifier)).resolves.toBe("user-1");
  });

  it("recusa o código sem o verificador certo", async () => {
    getdel.mockResolvedValue(JSON.stringify({ userId: "user-1", challenge: hash("o-certo") }));

    await expect(desktopLoginService.redeem("codigo", "o-errado")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("recusa código já usado ou expirado", async () => {
    getdel.mockResolvedValue(null);

    await expect(desktopLoginService.redeem("codigo", "verificador")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
