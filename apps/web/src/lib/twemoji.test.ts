import { describe, expect, it } from "vitest";

import { codepointDoEmoji, EMOJI } from "./twemoji";

/*
  O nome do arquivo é a única ponte entre o caractere e o desenho. Errar a conta
  não quebra nada de barulhento: o emoji some da tela e sobra o caractere, que é
  o comportamento antigo. Por isso vale teste — a falha é silenciosa e parece
  "não implementado".
*/
describe("codepointDoEmoji", () => {
  it("emoji simples é só o codepoint", () => {
    expect(codepointDoEmoji("😀")).toBe("1f600");
  });

  /// O seletor de variação pede "desenhe como emoji"; o Twemoji já é o desenho.
  it("tira o seletor de variação", () => {
    expect(codepointDoEmoji("❤️")).toBe("2764");
  });

  /*
    A exceção que quebra famílias e casais se esquecida: dentro de uma sequência
    com ZWJ, o seletor faz parte da identidade e FICA.
  */
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
  const achar = (texto: string) => texto.match(EMOJI) ?? [];

  it("acha emoji no meio da frase", () => {
    expect(achar("bom dia 😀 pessoal")).toEqual(["😀"]);
  });

  /*
    O que motivou trocar `\\p{Emoji}` por `Extended_Pictographic`: aquela
    propriedade casa com os dígitos, porque eles PODEM virar teclinha. Com ela,
    todo número de toda mensagem virava imagem.
  */
  it("não confunde número com emoji", () => {
    expect(achar("são 3 horas e 15 minutos")).toEqual([]);
  });

  it("mas a teclinha é emoji", () => {
    expect(achar("aperte 3️⃣")).toEqual(["3️⃣"]);
  });

  it("sequência com ZWJ vem inteira, não em pedaços", () => {
    expect(achar("👨‍👩‍👧")).toEqual(["👨‍👩‍👧"]);
  });

  it("bandeira vem inteira", () => {
    expect(achar("🇧🇷🇵🇹")).toEqual(["🇧🇷", "🇵🇹"]);
  });
});
