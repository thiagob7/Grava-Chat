import { describe, expect, it } from "vitest";
import { TrackSource } from "livekit-server-sdk";
import type { Permission } from "@gravae/shared";

import { fontesQuePodePublicar } from "./voice-service.js";

const contexto = (permissions: Permission[]) => ({ permissions: new Set(permissions) });

describe("o que cada permissão deixa publicar na chamada", () => {
  it("sem contexto (chamada de privado) libera tudo", () => {
    expect(fontesQuePodePublicar(true, null)).toEqual([
      TrackSource.MICROPHONE,
      TrackSource.CAMERA,
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO,
    ]);
  });

  it("só SPEAK dá microfone e nada mais", () => {
    expect(fontesQuePodePublicar(true, contexto(["CONNECT", "SPEAK"]))).toEqual([
      TrackSource.MICROPHONE,
    ]);
  });

  it("negar SHARE_SCREEN tira a tela mesmo com SPEAK e VIDEO", () => {
    const fontes = fontesQuePodePublicar(true, contexto(["SPEAK", "VIDEO"]));

    expect(fontes).toContain(TrackSource.CAMERA);
    expect(fontes).not.toContain(TrackSource.SCREEN_SHARE);
    expect(fontes).not.toContain(TrackSource.SCREEN_SHARE_AUDIO);
  });

  it("quem está mudo ainda transmite a tela", () => {
    const fontes = fontesQuePodePublicar(false, contexto(["SPEAK", "SHARE_SCREEN"]));

    expect(fontes).not.toContain(TrackSource.MICROPHONE);
    expect(fontes).toContain(TrackSource.SCREEN_SHARE);
  });

  it("sem nenhuma das três não sobra fonte", () => {
    expect(fontesQuePodePublicar(false, contexto(["CONNECT"]))).toEqual([]);
  });
});
