import { describe, expect, it } from "vitest";
import { TrackSource } from "livekit-server-sdk";
import type { Permission } from "@gravae/shared";

import { fontsCanPublish, slotFor } from "./voice-service.js";

const context = (permissions: Permission[]) => ({ permissions: new Set(permissions) });

describe("o que cada permissão deixa publicar na chamada", () => {
  it("sem contexto (chamada de privado) libera tudo", () => {
    expect(fontsCanPublish(true, null)).toEqual([
      TrackSource.MICROPHONE,
      TrackSource.CAMERA,
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO,
    ]);
  });

  it("só SPEAK dá microfone e nada mais", () => {
    expect(fontsCanPublish(true, context(["CONNECT", "SPEAK"]))).toEqual([
      TrackSource.MICROPHONE,
    ]);
  });

  it("negar SHARE_SCREEN tira a tela mesmo com SPEAK e VIDEO", () => {
    const fonts = fontsCanPublish(true, context(["SPEAK", "VIDEO"]));

    expect(fonts).toContain(TrackSource.CAMERA);
    expect(fonts).not.toContain(TrackSource.SCREEN_SHARE);
    expect(fonts).not.toContain(TrackSource.SCREEN_SHARE_AUDIO);
  });

  it("quem está mudo ainda transmite a tela", () => {
    const fonts = fontsCanPublish(false, context(["SPEAK", "SHARE_SCREEN"]));

    expect(fonts).not.toContain(TrackSource.MICROPHONE);
    expect(fonts).toContain(TrackSource.SCREEN_SHARE);
  });

  it("sem nenhuma das três não sobra fonte", () => {
    expect(fontsCanPublish(false, context(["CONNECT"]))).toEqual([]);
  });
});

describe("vaga de voz de cada conta", () => {
  it("pessoa tem uma vaga só, em qualquer servidor", () => {
    expect(slotFor("u1", "g1")).toBe("u1");
    expect(slotFor("u1", "g2")).toBe("u1");
  });

  it("bot tem uma vaga por servidor", () => {
    expect(slotFor("b1", "g1", true)).toBe("b1@g1");
    expect(slotFor("b1", "g2", true)).not.toBe(slotFor("b1", "g1", true));
  });

  it("bot em chamada de privado volta a ter vaga única", () => {
    expect(slotFor("b1", null, true)).toBe("b1");
  });
});
