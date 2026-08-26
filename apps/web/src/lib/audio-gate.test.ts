import { describe, expect, it } from "vitest";

import { decidirAbertura, limiarAutomatico, precisaRemontar, proximoPiso, SUSTENTACAO_MS } from "./audio-gate";

const base = { limiar: 0.1, pttPressionado: false, agora: 1_000, abertoAte: 0 };

describe("porta de voz — atividade de voz", () => {
  it("abre quando o nível passa do limiar", () => {
    const { aberto } = decidirAbertura({ ...base, modo: "voz", nivel: 0.2 });
    expect(aberto).toBe(true);
  });

  it("fica fechada com ruído abaixo do limiar", () => {
    const { aberto } = decidirAbertura({ ...base, modo: "voz", nivel: 0.05 });
    expect(aberto).toBe(false);
  });

  it("segura a porta aberta nas pausas entre as palavras", () => {
    const fala = decidirAbertura({ ...base, modo: "voz", nivel: 0.3 });

    const pausa = decidirAbertura({
      ...base,
      modo: "voz",
      nivel: 0,
      agora: base.agora + 200,
      abertoAte: fala.abertoAte,
    });

    expect(pausa.aberto).toBe(true);
  });

  it("fecha depois que a sustentação acaba", () => {
    const fala = decidirAbertura({ ...base, modo: "voz", nivel: 0.3 });

    const depois = decidirAbertura({
      ...base,
      modo: "voz",
      nivel: 0,
      agora: base.agora + SUSTENTACAO_MS + 10,
      abertoAte: fala.abertoAte,
    });

    expect(depois.aberto).toBe(false);
  });
});

describe("porta de voz — push-to-talk", () => {
  it("só transmite com a tecla pressionada, por mais alto que você fale", () => {
    const solta = decidirAbertura({ ...base, modo: "ptt", nivel: 0.9 });
    expect(solta.aberto).toBe(false);

    const pressionada = decidirAbertura({ ...base, modo: "ptt", nivel: 0, pttPressionado: true });
    expect(pressionada.aberto).toBe(true);
  });

  it("soltar a tecla corta na hora, sem sustentação", () => {
    const pressionada = decidirAbertura({ ...base, modo: "ptt", nivel: 0.5, pttPressionado: true });

    const solta = decidirAbertura({
      ...base,
      modo: "ptt",
      nivel: 0.5,
      agora: base.agora + 10,
      abertoAte: pressionada.abertoAte,
    });

    expect(solta.aberto).toBe(false);
  });
});

describe("sensibilidade automática", () => {
  it("o piso sobe quando o ambiente fica barulhento", () => {
    let piso = 0.02;
    for (let i = 0; i < 700; i++) piso = proximoPiso(piso, 0.05);

    expect(piso).toBeGreaterThan(0.04);
    expect(limiarAutomatico(piso)).toBeGreaterThan(0.05);
  });

  it("falar por muito tempo não levanta o piso (senão você some da chamada)", () => {
    let piso = 0.02;
    for (let i = 0; i < 1000; i++) piso = proximoPiso(piso, 0.35);

    expect(piso).toBe(0.02);
  });

  it("um pico de fala não puxa o piso pra cima", () => {
    const piso = 0.02;
    expect(proximoPiso(piso, 0.8)).toBe(piso);
  });

  it("no silêncio o limiar fica baixo, mas nunca em zero", () => {
    let piso = 0.02;
    for (let i = 0; i < 500; i++) piso = proximoPiso(piso, 0);

    expect(limiarAutomatico(piso)).toBeGreaterThanOrEqual(0.02);
    expect(limiarAutomatico(piso)).toBeLessThan(0.05);
  });
});

describe("precisaRemontar", () => {
  it("liga sem Krisp na cadeia: tem que montar", () => {
    expect(precisaRemontar({ temKrisp: false, estadoApos: false, alvo: true })).toBe(true);
  });

  it("desliga sem Krisp na cadeia: já é o estado atual", () => {
    expect(precisaRemontar({ temKrisp: false, estadoApos: false, alvo: false })).toBe(false);
  });

  it("troca no lugar que pegou não remonta", () => {
    expect(precisaRemontar({ temKrisp: true, estadoApos: true, alvo: true })).toBe(false);
    expect(precisaRemontar({ temKrisp: true, estadoApos: false, alvo: false })).toBe(false);
  });

  it("troca no lugar que NÃO pegou remonta", () => {
    expect(precisaRemontar({ temKrisp: true, estadoApos: false, alvo: true })).toBe(true);
    expect(precisaRemontar({ temKrisp: true, estadoApos: true, alvo: false })).toBe(true);
  });
});
