import { describe, expect, it } from "vitest";

import {
  ORIGIN_NAMES,
  namesDeclaredTheme,
  THEME_BRIDGE,
  translateTheme,
} from "./ponte-de-tema";
import tokensLive from "~/features/configuracoes/lib/tokens-vivos.json";

describe("ponte de tema", () => {
  it("traduz o fundo da lateral para o nosso nome", () => {
    expect(translateTheme({ "--background-secondary": "#1a181e" })).toEqual({
      "--color-surface-1": "#1a181e",
    });
  });

  it("uma origem pode pintar varios dos nossos", () => {
    const output = translateTheme({ "--background-secondary-lighter": "#1e1d23" });

    expect(output["--color-surface-2"]).toBe("#1e1d23");
    expect(output["--color-composer"]).toBe("#1e1d23");
  });

  it("o cabecalho do canal vem do token proprio deles", () => {
    expect(translateTheme({ "--background-channel-header": "#111" })["--color-cabecalho"]).toBe(
      "#111",
    );
  });

  it("varias origens podem cair no mesmo destino, e a ultima vale", () => {
    const output = translateTheme({
      "--background-header-secondary": "#aaa",
      "--border-color": "#bbb",
    });

    expect(output["--color-line"]).toBe("#bbb");
  });

  it("ignora o que o tema nao declarou", () => {
    expect(translateTheme({ "--background-secondary": "" })).toEqual({});
    expect(translateTheme({})).toEqual({});
  });

  it("nao pisa no token que a pessoa escolheu na mao", () => {
    const output = translateTheme(
      { "--background-secondary": "#000" },
      new Set(["--color-surface-1"]),
    );

    expect(output).toEqual({});
  });

  it("apara espaco em volta do valor", () => {
    expect(translateTheme({ "--text-primary": "  #fff  " })["--color-ink"]).toBe("#fff");
  });

  it("os nomes de origem batem com o mapa", () => {
    expect(ORIGIN_NAMES).toEqual(Object.keys(THEME_BRIDGE));
    expect(ORIGIN_NAMES.every((n) => n.startsWith("--"))).toBe(true);
  });

  it("todo destino é um token que o app realmente lê", () => {
    const live = new Set(tokensLive as string[]);
    const matched = new Set(["--font-display"]);

    const dead = [
      ...new Set(Object.values(THEME_BRIDGE).flat()),
    ].filter((destination) => !live.has(destination) && !matched.has(destination));

    expect(dead).toEqual([]);
  });
});

describe("o que o tema declarou", () => {
  it("acha as variáveis que o arquivo escreve", () => {
    const names = namesDeclaredTheme(`
      :root { --background-secondary: #111; --text-primary: #fff }
      body { --brand-primary: rgb(254, 128, 25); }
    `);

    expect([...names].sort()).toEqual([
      "--background-secondary",
      "--brand-primary",
      "--text-primary",
    ]);
  });

  it("não conta variável que o tema só lê", () => {
    const names = namesDeclaredTheme(
      ".x { color: var(--background-channel-header); border: 1px solid var(--text-primary) }",
    );

    expect([...names]).toEqual([]);
  });

  it("conta a que o tema declara em função de outra", () => {
    const names = namesDeclaredTheme(":root { --background-primary: var(--ThemeFlatDarker) }");

    expect([...names]).toEqual(["--background-primary"]);
  });

  it("deixa o nome canônico vencer o específico", () => {
    const names = Object.keys(THEME_BRIDGE);
    const before = (specific: string, canonical: string) =>
      names.indexOf(specific) < names.indexOf(canonical);

    const pairs: [string, string][] = [
      ["--button-primary-fill", "--brand-primary"],
      ["--button-primary-active-fill", "--brand-secondary"],
      ["--button-danger-fill", "--accent-danger"],
      ["--interactive-active", "--text-primary"],
      ["--interactive-muted", "--text-tertiary"],
      ["--bg-hover", "--background-modifier-hover"],
      ["--bg-active", "--background-modifier-selected"],
      ["--bg-primary", "--background-primary"],
      ["--accent-info", "--text-link"],
      ["--control-button-normal-text", "--text-secondary"],
    ];

    expect(pairs.filter(([e, c]) => !before(e, c))).toEqual([]);
  });

  it("o botão do tema pinta a nossa marca quando o tema só fala de botão", () => {
    expect(translateTheme({ "--button-primary-fill": "#ff0000" })).toEqual({
      "--color-brand": "#ff0000",
    });
  });

  it("mas a marca do tema vence o botão quando ele fala dos dois", () => {
    const output = translateTheme({
      "--button-primary-fill": "#ff0000",
      "--brand-primary": "#00ff00",
    });

    expect(output["--color-brand"]).toBe("#00ff00");
  });

  it("não repete um nome de origem em duas linhas", () => {
    const names = Object.keys(THEME_BRIDGE);

    expect(names).toHaveLength(new Set(names).size);
  });

  it("acha os nomes tanto em :root quanto em body", () => {
    const declarations = "--background-primary: #120e1a; --brand-primary: #8a5cf6;";

    const inRoot = namesDeclaredTheme(`:root { ${declarations} }`);
    const inBody = namesDeclaredTheme(`body { ${declarations} }`);

    expect([...inBody].sort()).toEqual([...inRoot].sort());
    expect(inBody.has("--background-primary")).toBe(true);
  });

  it("traduz o vocabulário do Discord, não só o da referência", () => {
    const output = translateTheme({
      "--header-primary": "#ffffff",
      "--text-muted": "#888888",
      "--brand-experiment": "#5865f2",
      "--channeltextarea-background": "#1e182e",
    });

    expect(output["--color-ink"]).toBe("#ffffff");
    expect(output["--color-ink-faint"]).toBe("#888888");
    expect(output["--color-brand"]).toBe("#5865f2");
    expect(output["--color-campo"]).toBe("#1e182e");
  });

  it("o nome da referência vence o do Discord quando o tema fala os dois", () => {
    const output = translateTheme({
      "--header-primary": "#111111",
      "--text-primary": "#222222",
    });

    expect(output["--color-ink"]).toBe("#222222");
  });
});
