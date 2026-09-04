import { describe, expect, it } from "vitest";

import { comoSeFala } from "~/lib/voz";

const fala = (texto: string) => comoSeFala({ autor: "Ana", texto });

describe("o que a voz diz", () => {
  it("anuncia quem falou", () => {
    expect(fala("bom dia")).toBe("Ana diz: bom dia");
  });

  it("troca o link pelo domínio", () => {
    expect(fala("olha https://github.com/thiagob7/Grava-Chat/pull/12")).toBe(
      "Ana diz: olha link de github.com",
    );
  });

  it("não lê bloco de código", () => {
    expect(fala("roda ```js\nconst x = 1;\n```")).toBe(
      "Ana diz: roda bloco de código",
    );
  });

  it("lê código na linha sem as crases", () => {
    expect(fala("usa o `yarn build`")).toBe("Ana diz: usa o yarn build");
  });

  it("não lê o id da menção", () => {
    expect(fala("obrigado <@507f1f77bcf86cd799439011>")).toBe(
      "Ana diz: obrigado menção",
    );
  });

  it("lê o nome do emoji personalizado, não o id", () => {
    expect(fala("boa <:foguete:507f1f77bcf86cd799439011>")).toBe(
      "Ana diz: boa foguete",
    );
  });

  it("tira a marcação de ênfase", () => {
    expect(fala("isso é **muito** ~~bom~~")).toBe("Ana diz: isso é muito bom");
  });

  it("diz que é anexo quando não há texto", () => {
    expect(fala("")).toBe("Ana mandou um anexo");
    expect(fala("   ")).toBe("Ana mandou um anexo");
  });

  it("corta o que é longo demais e avisa que cortou", () => {
    const falado = fala("a".repeat(500));

    expect(falado).toContain("mensagem cortada");
    expect(falado.length).toBeLessThan(360);
  });
});
