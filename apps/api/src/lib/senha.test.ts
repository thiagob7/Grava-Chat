import { describe, expect, it } from "vitest";

import { checkPassword, generateHash } from "~/lib/senha.js";

describe("senha", () => {
  it("confere a certa e recusa a errada", async () => {
    const kept = await generateHash("correta-e-longa");

    expect(kept.startsWith("scrypt$")).toBe(true);
    expect(kept).not.toContain("correta-e-longa");
    expect(await checkPassword("correta-e-longa", kept)).toBe(true);
    expect(await checkPassword("errada", kept)).toBe(false);
  });

  it("duas contas com a mesma senha não têm o mesmo hash", async () => {
    expect(await generateHash("igual")).not.toBe(await generateHash("igual"));
  });

  it("hash fora do formato não confere, nem quebra", async () => {
    expect(await checkPassword("x", "lixo")).toBe(false);
    expect(await checkPassword("x", "")).toBe(false);
  });
});
