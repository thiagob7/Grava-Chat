import { describe, expect, it } from "vitest";

import { normalizar, violacao } from "./automod.js";

const palavras = (lista: string[]) =>
  ({ trigger: "WORDS" as const, palavras: lista, limiteMencoes: null });

describe("automod — palavras", () => {
  it("pega a palavra no meio da frase", () => {
    expect(violacao("isso é uma bobagem enorme", palavras(["bobagem"]))).toContain("bobagem");
  });

  it("ignora maiúscula, acento e pontuação", () => {
    expect(violacao("QUE BOBAGEM!", palavras(["bobagem"]))).not.toBeNull();
    expect(violacao("que asneirá.", palavras(["asneira"]))).not.toBeNull();
  });

  it("não pega palavra que só CONTÉM o termo", () => {
    expect(violacao("isso é burrocracia pura", palavras(["burro"]))).toBeNull();
  });

  it("deixa passar quando nada bate", () => {
    expect(violacao("tudo certo por aqui", palavras(["bobagem", "asneira"]))).toBeNull();
  });

  it("lista vazia não bloqueia nada", () => {
    expect(violacao("qualquer coisa", palavras([]))).toBeNull();
  });

  it("caractere especial na lista não vira regex", () => {
    expect(() => violacao("teste", palavras(["(", "a+b"]))).not.toThrow();
    expect(violacao("conta a+b agora", palavras(["a+b"]))).not.toBeNull();
  });
});

describe("automod — menções", () => {
  const regra = { trigger: "MENTION_SPAM" as const, palavras: [], limiteMencoes: 3 };

  it("bloqueia a partir do limite", () => {
    const tres = "<@6a8781da7415b08f427be1a4> <@6a8781f57415b08f427be1ad> <@6a8781db7415b08f427be1aa>";
    expect(violacao(tres, regra)).not.toBeNull();
  });

  it("deixa passar abaixo do limite", () => {
    expect(violacao("<@6a8781da7415b08f427be1a4> oi", regra)).toBeNull();
  });

  it("menção de cargo conta — é a que notifica mais gente de uma vez", () => {
    const tres = "<@&6a8781da7415b08f427be1a4> <@&6a8781f57415b08f427be1ad> <@&6a8781db7415b08f427be1aa>";
    expect(violacao(tres, regra)).not.toBeNull();
  });

  it("cargo e usuário somam no mesmo contador", () => {
    const misto = "<@&6a8781da7415b08f427be1a4> <@6a8781f57415b08f427be1ad> @everyone";
    expect(violacao(misto, regra)).not.toBeNull();
  });

  it("@everyone conta como menção", () => {
    expect(violacao("@everyone @here <@6a8781da7415b08f427be1a4>", regra)).not.toBeNull();
  });
});

describe("automod — links", () => {
  const regra = { trigger: "LINKS" as const, palavras: [], limiteMencoes: null };

  it("pega http e www", () => {
    expect(violacao("olha https://exemplo.com/x", regra)).toBe("link");
    expect(violacao("vai em www.exemplo.com/x", regra)).toBe("link");
  });

  it("texto comum passa", () => {
    expect(violacao("falando de exemplo e ponto", regra)).toBeNull();
  });
});

describe("normalizar", () => {
  it("tira acento e caixa", () => {
    expect(normalizar("Ação É Ótimo")).toBe("acao e otimo");
  });
});
