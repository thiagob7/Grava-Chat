import { describe, expect, it } from "vitest";

import { chatStatus } from "./status-da-conversa";

describe("statusDaConversa", () => {
  it("sem nada acontecendo, não há subtítulo", () => {
    expect(chatStatus({ inCallWithMe: false, inVoiceServer: false })).toBeNull();
  });

  it("chamada de privado comigo", () => {
    expect(chatStatus({ inCallWithMe: true, inVoiceServer: false })).toEqual({
      key: "amizades.status.emChamada",
      kind: "chamada",
    });
  });

  it("em voz num servidor que compartilhamos", () => {
    expect(chatStatus({ inCallWithMe: false, inVoiceServer: true })).toEqual({
      key: "amizades.status.emVoz",
      kind: "voz",
    });
  });

  it("estando nos dois, a chamada comigo vence", () => {
    expect(chatStatus({ inCallWithMe: true, inVoiceServer: true })?.kind).toBe("chamada");
  });
});
