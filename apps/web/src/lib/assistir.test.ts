import { describe, expect, it } from "vitest";

import { proximoAlvo, type EscolhaDeAlvo } from "./assistir";

const base: EscolhaDeAlvo = { atual: null, alvoAindaTransmite: false };

describe("proximoAlvo", () => {
  /*
    O bug original: `refresh()` roda a cada faixa que muda, e a versão antiga
    reescrevia o alvo pra você mesmo em todo evento enquanto você transmitisse.
    Assistir a outra pessoa era impossível — durava até alguém mutar o mic.
  */
  it("a escolha de assistir a alguém sobrevive a vários eventos seguidos", () => {
    const assistindoAmigo = { atual: "amigo", alvoAindaTransmite: true };

    let alvo = proximoAlvo(assistindoAmigo);
    for (let i = 0; i < 5; i++) alvo = proximoAlvo({ ...assistindoAmigo, atual: alvo });

    expect(alvo).toBe("amigo");
  });

  /*
    A segunda versão errada. Abrir a própria transmissão jogava você na tela
    cheia dela — e assim você nunca via a grade, onde o seu card de pessoa fica
    ao lado do quadro da sua live. Começar a transmitir não muda mais o que
    você está vendo.
  */
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
