import { describe, expect, it } from "vitest";

import { codepointDoEmoji, EMOJI } from "./twemoji";

describe("codepointDoEmoji", () => {
  it("emoji simples é só o codepoint", () => {
    expect(codepointDoEmoji("😀")).toBe("1f600");
  });

  it("tira o seletor de variação", () => {
    expect(codepointDoEmoji("❤️")).toBe("2764");
  });

  it("mantém o seletor dentro de sequência com ZWJ", () => {
    expect(codepointDoEmoji("👨‍❤️‍👨")).toBe("1f468-200d-2764-fe0f-200d-1f468");
  });

  it("bandeira é o par de indicadores regionais", () => {
    expect(codepointDoEmoji("🇧🇷")).toBe("1f1e7-1f1f7");
  });

  it("tom de pele entra no nome", () => {
    expect(codepointDoEmoji("👍🏽")).toBe("1f44d-1f3fd");
  });
});

describe("EMOJI", () => {
  const find = (text: string) => text.match(EMOJI) ?? [];

  it("acha emoji no meio da frase", () => {
    expect(find("bom dia 😀 pessoal")).toEqual(["😀"]);
  });

  it("não confunde número com emoji", () => {
    expect(find("são 3 horas e 15 minutos")).toEqual([]);
  });

  it("mas a teclinha é emoji", () => {
    expect(find("aperte 3️⃣")).toEqual(["3️⃣"]);
  });

  it("sequência com ZWJ vem inteira, não em pedaços", () => {
    expect(find("👨‍👩‍👧")).toEqual(["👨‍👩‍👧"]);
  });

  it("bandeira vem inteira", () => {
    expect(find("🇧🇷🇵🇹")).toEqual(["🇧🇷", "🇵🇹"]);
  });
});
