import { describe, expect, it } from "vitest";

import { keepSteady, sameTile } from "./quadros";
import type { VoiceTile } from "~/features/voz/stores/voice-store";

const tile = (patch: Partial<VoiceTile> = {}): VoiceTile => ({
  identity: "u1",
  name: "Thiago",
  avatarUrl: null,
  isLocal: false,
  speaking: false,
  micEnabled: true,
  cameraTrack: null,
  screenTrack: null,
  micTrack: null,
  screenAudioTrack: null,
  quality: "excellent",
  ...patch,
});

describe("comparação de quadro", () => {
  it("dois quadros de mesmo conteúdo são iguais", () => {
    expect(sameTile(tile(), tile())).toBe(true);
  });

  it("começar a falar muda o quadro", () => {
    expect(sameTile(tile(), tile({ speaking: true }))).toBe(false);
  });

  it("faixa diferente muda o quadro, mesmo com o resto igual", () => {
    const faixa = {} as VoiceTile["cameraTrack"];
    expect(sameTile(tile({ cameraTrack: faixa }), tile({ cameraTrack: {} as typeof faixa }))).toBe(
      false,
    );
  });
});

describe("lista firme entre redesenhos", () => {
  it("ninguém mudou: devolve a MESMA lista, não uma cópia", () => {
    const antes = [tile({ identity: "a" }), tile({ identity: "b" })];
    const depois = [tile({ identity: "a" }), tile({ identity: "b" })];

    expect(keepSteady(antes, depois)).toBe(antes);
  });

  it("um mudou: só o dele é novo, o outro continua sendo o mesmo objeto", () => {
    const antes = [tile({ identity: "a" }), tile({ identity: "b" })];
    const depois = [tile({ identity: "a" }), tile({ identity: "b", speaking: true })];

    const firme = keepSteady(antes, depois);

    expect(firme).not.toBe(antes);
    expect(firme[0]).toBe(antes[0]);
    expect(firme[1]).toBe(depois[1]);
  });

  it("alguém entrou ou saiu: lista nova inteira", () => {
    const antes = [tile({ identity: "a" })];
    const depois = [tile({ identity: "a" }), tile({ identity: "b" })];

    expect(keepSteady(antes, depois)).toBe(depois);
  });
});
