import { describe, expect, it } from "vitest";

import { isMoreNew } from "./versao.js";

describe("ehMaisNova", () => {
  it("compara por número, e não alfabeticamente", () => {
    expect(isMoreNew("0.10.0", "0.9.0")).toBe(true);
    expect(isMoreNew("0.9.0", "0.10.0")).toBe(false);
  });

  it("aceita o v da tag do git", () => {
    expect(isMoreNew("v0.1.4", "0.1.3")).toBe(true);
  });

  it("a mesma versão não é mais nova", () => {
    expect(isMoreNew("0.1.3", "0.1.3")).toBe(false);
  });

  it("compara os campos em ordem", () => {
    expect(isMoreNew("1.0.0", "0.99.99")).toBe(true);
    expect(isMoreNew("0.1.4", "0.1.3")).toBe(true);
    expect(isMoreNew("0.1.3", "0.1.4")).toBe(false);
  });

  it("aguenta versão mais curta dos dois lados", () => {
    expect(isMoreNew("0.2", "0.1.9")).toBe(true);
    expect(isMoreNew("0.1", "0.1.0")).toBe(false);
  });
});
