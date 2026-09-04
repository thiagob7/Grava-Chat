import { describe, expect, it } from "vitest";

import { proximoAlvo, type EscolhaDeAlvo } from "./assistir";

const base: EscolhaDeAlvo = { atual: null, alvoAindaTransmite: false };

describe("proximoAlvo", () => {
  it("a escolha de assistir a alguém sobrevive a vários eventos seguidos", () => {
    const assistindoAmigo = { atual: "amigo", alvoAindaTransmite: true };

    let alvo = proximoAlvo(assistindoAmigo);
    for (let i = 0; i < 5; i++) alvo = proximoAlvo({ ...assistindoAmigo, atual: alvo });

    expect(alvo).toBe("amigo");
  });

  it("começar a transmitir não sequestra a tela", () => {
    expect(proximoAlvo(base)).toBeNull();
  });

  it("quando a transmissão que eu assistia acaba, volta pra grade", () => {
    expect(proximoAlvo({ atual: "amigo", alvoAindaTransmite: false })).toBeNull();
  });

  it("sem nada escolhido, fica na grade", () => {
    expect(proximoAlvo(base)).toBeNull();
  });

  it("alvo escolhido e no ar continua no ar", () => {
    expect(proximoAlvo({ atual: "amigo", alvoAindaTransmite: true })).toBe("amigo");
  });
});
