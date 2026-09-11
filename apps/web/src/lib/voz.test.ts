import { describe, expect, it } from "vitest";

import { asSpeech } from "~/lib/voz";

const speech = (text: string) => asSpeech({ author: "Ana", text });

describe("o que a voz diz", () => {
  it("anuncia quem falou", () => {
    expect(speech("bom dia")).toBe("Ana diz: bom dia");
  });

  it("troca o link pelo domínio", () => {
    expect(speech("olha https://github.com/thiagob7/Grava-Chat/pull/12")).toBe(
      "Ana diz: olha link de github.com",
    );
  });

  it("não lê bloco de código", () => {
    expect(speech("roda ```js\nconst x = 1;\n```")).toBe(
      "Ana diz: roda bloco de código",
    );
  });

  it("lê código na linha sem as crases", () => {
    expect(speech("usa o `yarn build`")).toBe("Ana diz: usa o yarn build");
  });

  it("não lê o id da menção", () => {
    expect(speech("obrigado <@507f1f77bcf86cd799439011>")).toBe(
      "Ana diz: obrigado menção",
    );
  });

  it("lê o nome do emoji personalizado, não o id", () => {
    expect(speech("boa <:foguete:507f1f77bcf86cd799439011>")).toBe(
      "Ana diz: boa foguete",
    );
  });

  it("tira a marcação de ênfase", () => {
    expect(speech("isso é **muito** ~~bom~~")).toBe("Ana diz: isso é muito bom");
  });

  it("diz que é anexo quando não há texto", () => {
    expect(speech("")).toBe("Ana mandou um anexo");
    expect(speech("   ")).toBe("Ana mandou um anexo");
  });

  it("corta o que é longo demais e avisa que cortou", () => {
    const spoken = speech("a".repeat(500));

    expect(spoken).toContain("mensagem cortada");
    expect(spoken.length).toBeLessThan(360);
  });
});
