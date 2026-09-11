import { describe, expect, it } from "vitest";

import { decideOpening, thresholdAutomatic, nextFloor, SUSTAIN_MS } from "./audio-gate";

const base = { threshold: 0.1, pttPressed: false, now: 1_000, isOpenUntil: 0 };

describe("porta de voz — atividade de voz", () => {
  it("abre quando o nível passa do limiar", () => {
    const { isOpen } = decideOpening({ ...base, mode: "voz", level: 0.2 });
    expect(isOpen).toBe(true);
  });

  it("fica fechada com ruído abaixo do limiar", () => {
    const { isOpen } = decideOpening({ ...base, mode: "voz", level: 0.05 });
    expect(isOpen).toBe(false);
  });

  it("segura a porta aberta nas pausas entre as palavras", () => {
    const speech = decideOpening({ ...base, mode: "voz", level: 0.3 });

    const pause = decideOpening({
      ...base,
      mode: "voz",
      level: 0,
      now: base.now + 200,
      isOpenUntil: speech.isOpenUntil,
    });

    expect(pause.isOpen).toBe(true);
  });

  it("fecha depois que a sustentação acaba", () => {
    const speech = decideOpening({ ...base, mode: "voz", level: 0.3 });

    const after = decideOpening({
      ...base,
      mode: "voz",
      level: 0,
      now: base.now + SUSTAIN_MS + 10,
      isOpenUntil: speech.isOpenUntil,
    });

    expect(after.isOpen).toBe(false);
  });
});

describe("porta de voz — push-to-talk", () => {
  it("só transmite com a tecla pressionada, por mais alto que você fale", () => {
    const loose = decideOpening({ ...base, mode: "ptt", level: 0.9 });
    expect(loose.isOpen).toBe(false);

    const pressed = decideOpening({ ...base, mode: "ptt", level: 0, pttPressed: true });
    expect(pressed.isOpen).toBe(true);
  });

  it("soltar a tecla corta na hora, sem sustentação", () => {
    const pressed = decideOpening({ ...base, mode: "ptt", level: 0.5, pttPressed: true });

    const loose = decideOpening({
      ...base,
      mode: "ptt",
      level: 0.5,
      now: base.now + 10,
      isOpenUntil: pressed.isOpenUntil,
    });

    expect(loose.isOpen).toBe(false);
  });
});

describe("sensibilidade automática", () => {
  it("o piso sobe quando o ambiente fica barulhento", () => {
    let floor = 0.02;
    for (let i = 0; i < 700; i++) floor = nextFloor(floor, 0.05);

    expect(floor).toBeGreaterThan(0.04);
    expect(thresholdAutomatic(floor)).toBeGreaterThan(0.05);
  });

  it("falar por muito tempo não levanta o piso (senão você some da chamada)", () => {
    let floor = 0.02;
    for (let i = 0; i < 1000; i++) floor = nextFloor(floor, 0.35);

    expect(floor).toBe(0.02);
  });

  it("um pico de fala não puxa o piso pra cima", () => {
    const floor = 0.02;
    expect(nextFloor(floor, 0.8)).toBe(floor);
  });

  it("no silêncio o limiar fica baixo, mas nunca em zero", () => {
    let floor = 0.02;
    for (let i = 0; i < 500; i++) floor = nextFloor(floor, 0);

    expect(thresholdAutomatic(floor)).toBeGreaterThanOrEqual(0.02);
    expect(thresholdAutomatic(floor)).toBeLessThan(0.05);
  });
});
