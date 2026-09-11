import { describe, expect, it } from "vitest";

import { checkTokens } from "./compatibilidade-de-tokens";

describe("compatibilidade de tokens", () => {
  it("conta como traduzido o que a ponte leva a um token nosso", () => {
    const { translated, ignoredList } = checkTokens(
      ":root { --background-primary: #120e1a; --brand-primary: #8a5cf6; }",
    );

    expect(translated).toEqual(["--background-primary", "--brand-primary"]);
    expect(ignoredList).toEqual([]);
  });

  it("acha o mesmo quando o tema declara em body", () => {
    const inRoot = checkTokens(":root { --background-primary: #120e1a; }");
    const inBody = checkTokens("body { --background-primary: #120e1a; }");

    expect(inBody.translated).toEqual(inRoot.translated);
  });

  it("aponta o que o tema declarou e ninguém lê", () => {
    const { ignoredList } = checkTokens(":root { --coisa-que-nao-existe: red; }");

    expect(ignoredList).toEqual(["--coisa-que-nao-existe"]);
  });

  it("não acusa a variável que o próprio tema usa", () => {
    const { ignoredList } = checkTokens(
      "body { --primary-theme-accent: #ff0000; } .x { color: var(--primary-theme-accent); }",
    );

    expect(ignoredList).toEqual([]);
  });

  it("traduz o vocabulário do Discord também", () => {
    const { translated, ignoredList } = checkTokens(
      ":root { --header-primary: #fff; --interactive-normal: #888; }",
    );

    expect(translated).toEqual(["--header-primary", "--interactive-normal"]);
    expect(ignoredList).toEqual([]);
  });

  it("não conta como deduzido o token que o tema mandou direto", () => {
    const { inferred } = checkTokens(":root { --background-primary: #120e1a; }");

    expect(inferred).not.toContain("--color-surface-0");
  });
});
