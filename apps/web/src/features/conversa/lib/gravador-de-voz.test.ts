import { describe, expect, it } from "vitest";

import {
  BARRAS,
  bytesEstimados,
  duracaoEscrita,
  encaixarOndas,
  escreverOndas,
  extensaoDoFormato,
  formatoDeGravacao,
  lerOndas,
  LIMITE_MS,
  TAXA_DE_VOZ,
} from "./gravador-de-voz";

describe("escolha do formato", () => {
  it("prefere opus quando o navegador aceita", () => {
    expect(formatoDeGravacao(() => true)).toBe("audio/webm;codecs=opus");
  });

  it("cai no mp4 do Safari em vez de desistir", () => {
    expect(formatoDeGravacao((t) => t === "audio/mp4")).toBe("audio/mp4");
  });

  it("devolve nulo quando o navegador não grava nada disso", () => {
    expect(formatoDeGravacao(() => false)).toBeNull();
  });

  it("a extensão acompanha o formato", () => {
    expect(extensaoDoFormato("audio/webm;codecs=opus")).toBe("webm");
    expect(extensaoDoFormato("audio/ogg;codecs=opus")).toBe("ogg");
    expect(extensaoDoFormato("audio/mp4")).toBe("m4a");
  });
});

describe("encaixar a onda", () => {
  it("sempre entrega o número fixo de barras", () => {
    for (const quantos of [0, 1, 7, 40, 41, 5000]) {
      expect(encaixarOndas(new Array(quantos).fill(0.5))).toHaveLength(BARRAS);
    }
  });

  it("guarda o pico do pedaço, não a média", () => {
    const picos = [...new Array(80).fill(0)];
    picos[3] = 1;

    expect(Math.max(...encaixarOndas(picos))).toBe(1);
  });

  it("gravação vazia vira silêncio, não erro", () => {
    expect(encaixarOndas([])).toEqual(new Array(BARRAS).fill(0));
  });
});

describe("escrever e ler a onda", () => {
  it("cabe num caractere por barra", () => {
    expect(escreverOndas(new Array(BARRAS).fill(0.5))).toHaveLength(BARRAS);
  });

  it("ida e volta preserva o desenho", () => {
    const original = [0, 0.5, 1];
    const lido = lerOndas(escreverOndas(original));

    expect(lido[0]).toBe(0);
    expect(lido[2]).toBe(1);
    expect(lido[1]).toBeCloseTo(0.5, 1);
  });

  it("aguenta valor fora da faixa sem estourar", () => {
    expect(escreverOndas([-3, 9])).toBe("0z");
  });

  it("anexo sem onda não quebra a tela", () => {
    expect(lerOndas(null)).toEqual([]);
    expect(lerOndas(undefined)).toEqual([]);
    expect(lerOndas("")).toEqual([]);
  });
});

describe("duração escrita", () => {
  it("segura os dois dígitos do segundo", () => {
    expect(duracaoEscrita(7000)).toBe("0:07");
    expect(duracaoEscrita(65_000)).toBe("1:05");
    expect(duracaoEscrita(LIMITE_MS)).toBe("2:00");
  });

  it("não escreve tempo negativo", () => {
    expect(duracaoEscrita(-50)).toBe("0:00");
  });
});

describe("tamanho estimado", () => {
  it("dois minutos a 24 kbps ficam perto de 350 KB", () => {
    const kb = bytesEstimados(LIMITE_MS) / 1024;

    expect(kb).toBeGreaterThan(330);
    expect(kb).toBeLessThan(370);
  });

  it("a taxa é a que a gente escolheu, não a do navegador", () => {
    expect(TAXA_DE_VOZ).toBe(24_000);
  });
});
