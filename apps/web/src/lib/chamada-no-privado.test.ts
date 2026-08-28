import { describe, expect, it } from "vitest";

import { deveTocar, type ChamadaRecebida } from "./chamada-no-privado";

const base: ChamadaRecebida = {
  guildId: null,
  channelId: "dm-1",
  quemEntrou: "amigo",
  euSou: "eu",
  meuCanalDeVoz: null,
};

describe("deveTocar", () => {
  it("o amigo entrou na nossa conversa: está me ligando", () => {
    expect(deveTocar(base)).toBe(true);
  });

  it("toca mesmo se eu estiver noutra chamada — o aviso é o que deixa eu decidir", () => {
    expect(deveTocar({ ...base, meuCanalDeVoz: "outro-canal" })).toBe(true);
  });

  it("entrar num canal de voz de servidor não interrompe ninguém", () => {
    expect(deveTocar({ ...base, guildId: "servidor-1" })).toBe(false);
  });

  /*
    O `voice:joined` volta pelas salas de usuário dos DOIS participantes, então
    o próprio join chega de volta pra quem o fez. Sem esta guarda, ligar pra
    alguém faria o telefone tocar na sua própria mão.
  */
  it("meu próprio join não toca pra mim", () => {
    expect(deveTocar({ ...base, quemEntrou: "eu" })).toBe(false);
  });

  it("já estando os dois na chamada, é chegada e não chamada", () => {
    expect(deveTocar({ ...base, meuCanalDeVoz: "dm-1" })).toBe(false);
  });
});
