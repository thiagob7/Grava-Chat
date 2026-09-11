import { describe, expect, it } from "vitest";

import { mustPlay, thisCalling, type CallReceived } from "./chamada-no-privado";

const base: CallReceived = {
  guildId: null,
  channelId: "dm-1",
  whoJoined: "amigo",
  euAm: "eu",
  voiceMyChannel: null,
};

describe("deveTocar", () => {
  it("o amigo entrou na nossa conversa: está me ligando", () => {
    expect(mustPlay(base)).toBe(true);
  });

  it("toca mesmo se eu estiver noutra chamada — o aviso é o que deixa eu decidir", () => {
    expect(mustPlay({ ...base, voiceMyChannel: "outro-canal" })).toBe(true);
  });

  it("entrar num canal de voz de servidor não interrompe ninguém", () => {
    expect(mustPlay({ ...base, guildId: "servidor-1" })).toBe(false);
  });

  it("meu próprio join não toca pra mim", () => {
    expect(mustPlay({ ...base, whoJoined: "eu" })).toBe(false);
  });

  it("já estando os dois na chamada, é chegada e não chamada", () => {
    expect(mustPlay({ ...base, voiceMyChannel: "dm-1" })).toBe(false);
  });
});

describe("estaChamando", () => {
  it("sozinho na sala de um privado é telefone tocando do outro lado", () => {
    expect(thisCalling({ guildId: null, countRoom: 1 })).toBe(true);
  });

  it("com a outra pessoa dentro, a chamada está em curso", () => {
    expect(thisCalling({ guildId: null, countRoom: 2 })).toBe(false);
  });

  it("sozinho num canal de servidor não é chamada", () => {
    expect(thisCalling({ guildId: "servidor-1", countRoom: 1 })).toBe(false);
  });

  it("sala vazia (antes do SFU responder) não trava em 'chamando'", () => {
    expect(thisCalling({ guildId: null, countRoom: 0 })).toBe(true);
  });
});
