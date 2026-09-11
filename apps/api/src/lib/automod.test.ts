import { describe, expect, it } from "vitest";

import { normalize, violation } from "./automod.js";

const words = (list: string[]) =>
  ({ trigger: "WORDS" as const, words: list, limitMentions: null });

describe("automod — palavras", () => {
  it("pega a palavra no meio da frase", () => {
    expect(violation("isso é uma bobagem enorme", words(["bobagem"]))).toContain("bobagem");
  });

  it("ignora maiúscula, acento e pontuação", () => {
    expect(violation("QUE BOBAGEM!", words(["bobagem"]))).not.toBeNull();
    expect(violation("que asneirá.", words(["asneira"]))).not.toBeNull();
  });

  it("não pega palavra que só CONTÉM o termo", () => {
    expect(violation("isso é burrocracia pura", words(["burro"]))).toBeNull();
  });

  it("deixa passar quando nada bate", () => {
    expect(violation("tudo certo por aqui", words(["bobagem", "asneira"]))).toBeNull();
  });

  it("lista vazia não bloqueia nada", () => {
    expect(violation("qualquer coisa", words([]))).toBeNull();
  });

  it("caractere especial na lista não vira regex", () => {
    expect(() => violation("teste", words(["(", "a+b"]))).not.toThrow();
    expect(violation("conta a+b agora", words(["a+b"]))).not.toBeNull();
  });
});

describe("automod — menções", () => {
  const rule = { trigger: "MENTION_SPAM" as const, words: [], limitMentions: 3 };

  it("bloqueia a partir do limite", () => {
    const three = "<@6a8781da7415b08f427be1a4> <@6a8781f57415b08f427be1ad> <@6a8781db7415b08f427be1aa>";
    expect(violation(three, rule)).not.toBeNull();
  });

  it("deixa passar abaixo do limite", () => {
    expect(violation("<@6a8781da7415b08f427be1a4> oi", rule)).toBeNull();
  });

  it("menção de cargo conta — é a que notifica mais gente de uma vez", () => {
    const three = "<@&6a8781da7415b08f427be1a4> <@&6a8781f57415b08f427be1ad> <@&6a8781db7415b08f427be1aa>";
    expect(violation(three, rule)).not.toBeNull();
  });

  it("cargo e usuário somam no mesmo contador", () => {
    const mixed = "<@&6a8781da7415b08f427be1a4> <@6a8781f57415b08f427be1ad> @everyone";
    expect(violation(mixed, rule)).not.toBeNull();
  });

  it("@everyone conta como menção", () => {
    expect(violation("@everyone @here <@6a8781da7415b08f427be1a4>", rule)).not.toBeNull();
  });
});

describe("automod — links", () => {
  const rule = { trigger: "LINKS" as const, words: [], limitMentions: null };

  it("pega http e www", () => {
    expect(violation("olha https://exemplo.com/x", rule)).toBe("link");
    expect(violation("vai em www.exemplo.com/x", rule)).toBe("link");
  });

  it("texto comum passa", () => {
    expect(violation("falando de exemplo e ponto", rule)).toBeNull();
  });
});

describe("normalizar", () => {
  it("tira acento e caixa", () => {
    expect(normalize("Ação É Ótimo")).toBe("acao e otimo");
  });
});
