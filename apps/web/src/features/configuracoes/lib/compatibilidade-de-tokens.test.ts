import { describe, expect, it } from "vitest";

import { conferirTokens } from "./compatibilidade-de-tokens";

describe("compatibilidade de tokens", () => {
  it("conta como traduzido o que a ponte leva a um token nosso", () => {
    const { traduzidos, ignorados } = conferirTokens(
      ":root { --background-primary: #120e1a; --brand-primary: #8a5cf6; }",
    );

    expect(traduzidos).toEqual(["--background-primary", "--brand-primary"]);
    expect(ignorados).toEqual([]);
  });

  it("acha o mesmo quando o tema declara em body", () => {
    const naRaiz = conferirTokens(":root { --background-primary: #120e1a; }");
    const noBody = conferirTokens("body { --background-primary: #120e1a; }");

    expect(noBody.traduzidos).toEqual(naRaiz.traduzidos);
  });

  it("aponta o que o tema declarou e ninguém lê", () => {
    const { ignorados } = conferirTokens(":root { --coisa-que-nao-existe: red; }");

    expect(ignorados).toEqual(["--coisa-que-nao-existe"]);
  });

  /*
    O caso que motivou o arquivo: um tema define as próprias variáveis e usa
    nas próprias regras. Chamar isso de "ignorado" mandaria a pessoa caçar um
    problema que não existe.
  */
  it("não acusa a variável que o próprio tema usa", () => {
    const { ignorados } = conferirTokens(
      "body { --primary-theme-accent: #ff0000; } .x { color: var(--primary-theme-accent); }",
    );

    expect(ignorados).toEqual([]);
  });

  it("traduz o vocabulário do Discord também", () => {
    const { traduzidos, ignorados } = conferirTokens(
      ":root { --header-primary: #fff; --interactive-normal: #888; }",
    );

    expect(traduzidos).toEqual(["--header-primary", "--interactive-normal"]);
    expect(ignorados).toEqual([]);
  });

  /*
    Quem declara o fundo ganha as superfícies de graça; quem não declara nada
    não deduz nada que valha contar — mas a lista de derivados existe sempre,
    porque ela é o que as cores-mãe sabem preencher.
  */
  it("não conta como deduzido o token que o tema mandou direto", () => {
    const { deduzidos } = conferirTokens(":root { --background-primary: #120e1a; }");

    expect(deduzidos).not.toContain("--color-surface-0");
  });
});
