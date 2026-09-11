import { describe, expect, it } from "vitest";

import {
  BARRAS,
  bytesEstimated,
  durationWriting,
  fitWaves,
  writeWaves,
  formatExtension,
  formatRecording,
  readWaves,
  LIMIT_MS,
  VOICE_RATE,
} from "./gravador-de-voz";

describe("escolha do formato", () => {
  it("prefere opus quando o navegador aceita", () => {
    expect(formatRecording(() => true)).toBe("audio/webm;codecs=opus");
  });

  it("cai no mp4 do Safari em vez de desistir", () => {
    expect(formatRecording((t) => t === "audio/mp4")).toBe("audio/mp4");
  });

  it("devolve nulo quando o navegador não grava nada disso", () => {
    expect(formatRecording(() => false)).toBeNull();
  });

  it("a extensão acompanha o formato", () => {
    expect(formatExtension("audio/webm;codecs=opus")).toBe("webm");
    expect(formatExtension("audio/ogg;codecs=opus")).toBe("ogg");
    expect(formatExtension("audio/mp4")).toBe("m4a");
  });
});

describe("encaixar a onda", () => {
  it("sempre entrega o número fixo de barras", () => {
    for (const count of [0, 1, 7, 40, 41, 5000]) {
      expect(fitWaves(new Array(count).fill(0.5))).toHaveLength(BARRAS);
    }
  });

  it("guarda o pico do pedaço, não a média", () => {
    const peaks = [...new Array(80).fill(0)];
    peaks[3] = 1;

    expect(Math.max(...fitWaves(peaks))).toBe(1);
  });

  it("gravação vazia vira silêncio, não erro", () => {
    expect(fitWaves([])).toEqual(new Array(BARRAS).fill(0));
  });
});

describe("escrever e ler a onda", () => {
  it("cabe num caractere por barra", () => {
    expect(writeWaves(new Array(BARRAS).fill(0.5))).toHaveLength(BARRAS);
  });

  it("ida e volta preserva o desenho", () => {
    const original = [0, 0.5, 1];
    const read = readWaves(writeWaves(original));

    expect(read[0]).toBe(0);
    expect(read[2]).toBe(1);
    expect(read[1]).toBeCloseTo(0.5, 1);
  });

  it("aguenta valor fora da faixa sem estourar", () => {
    expect(writeWaves([-3, 9])).toBe("0z");
  });

  it("anexo sem onda não quebra a tela", () => {
    expect(readWaves(null)).toEqual([]);
    expect(readWaves(undefined)).toEqual([]);
    expect(readWaves("")).toEqual([]);
  });
});

describe("duração escrita", () => {
  it("segura os dois dígitos do segundo", () => {
    expect(durationWriting(7000)).toBe("0:07");
    expect(durationWriting(65_000)).toBe("1:05");
    expect(durationWriting(LIMIT_MS)).toBe("2:00");
  });

  it("não escreve tempo negativo", () => {
    expect(durationWriting(-50)).toBe("0:00");
  });
});

describe("tamanho estimado", () => {
  it("dois minutos a 24 kbps ficam perto de 350 KB", () => {
    const kb = bytesEstimated(LIMIT_MS) / 1024;

    expect(kb).toBeGreaterThan(330);
    expect(kb).toBeLessThan(370);
  });

  it("a taxa é a que a gente escolheu, não a do navegador", () => {
    expect(VOICE_RATE).toBe(24_000);
  });
});
