import { describe, expect, it } from "vitest";

import { cabeNaCota, mensagemDeCota, COTA_POR_HORA } from "./cota-de-upload.js";

const MB = 1024 * 1024;

describe("cabeNaCota", () => {
  it("quem não enviou nada envia", () => {
    expect(cabeNaCota({ jaUsado: 0, tamanho: 50 * MB })).toBe(true);
  });

  it("um dia inteiro de fotos comprimidas passa longe do teto", () => {
    expect(cabeNaCota({ jaUsado: 100 * MB, tamanho: 700 * 1024 })).toBe(true);
  });

  it("barra o arquivo que estouraria a cota", () => {
    expect(cabeNaCota({ jaUsado: 480 * MB, tamanho: 50 * MB })).toBe(false);
  });

  it("encaixar exatamente na cota ainda passa", () => {
    expect(cabeNaCota({ jaUsado: COTA_POR_HORA - MB, tamanho: MB })).toBe(true);
  });

  it("um byte além já não passa", () => {
    expect(cabeNaCota({ jaUsado: COTA_POR_HORA, tamanho: 1 })).toBe(false);
  });

  it("a rajada de vídeos que o limite por requisição deixava passar é barrada", () => {
    let usado = 0;
    let aceitos = 0;

    for (let i = 0; i < 60; i++) {
      if (!cabeNaCota({ jaUsado: usado, tamanho: 50 * MB })) break;
      usado += 50 * MB;
      aceitos++;
    }

    expect(aceitos).toBe(10);
    expect(usado).toBeLessThanOrEqual(COTA_POR_HORA);
  });
});

describe("mensagemDeCota", () => {
  it("diz quanto falta, pra dar o que decidir", () => {
    const texto = mensagemDeCota({ jaUsado: 500 * MB });

    expect(texto).toContain("500 MB");
    expect(texto).toContain("restam 0 MB");
  });

  it("nunca anuncia sobra negativa", () => {
    expect(mensagemDeCota({ jaUsado: 900 * MB })).toContain("restam 0 MB");
  });
});
