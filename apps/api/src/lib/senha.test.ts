import { describe, expect, it } from "vitest";

import { conferirSenha, gerarHash } from "~/lib/senha.js";

describe("senha", () => {
  it("confere a certa e recusa a errada", async () => {
    const guardado = await gerarHash("correta-e-longa");

    expect(guardado.startsWith("scrypt$")).toBe(true);
    expect(guardado).not.toContain("correta-e-longa");
    expect(await conferirSenha("correta-e-longa", guardado)).toBe(true);
    expect(await conferirSenha("errada", guardado)).toBe(false);
  });

  it("duas contas com a mesma senha não têm o mesmo hash", async () => {
    expect(await gerarHash("igual")).not.toBe(await gerarHash("igual"));
  });

  it("hash fora do formato não confere, nem quebra", async () => {
    expect(await conferirSenha("x", "lixo")).toBe(false);
    expect(await conferirSenha("x", "")).toBe(false);
  });
});
