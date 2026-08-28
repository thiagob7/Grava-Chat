import { describe, expect, it } from "vitest";

import { statusDaConversa } from "./status-da-conversa";

describe("statusDaConversa", () => {
  it("sem nada acontecendo, não há subtítulo", () => {
    expect(statusDaConversa({ emChamadaComigo: false, emVozNoServidor: false })).toBeNull();
  });

  it("chamada de privado comigo", () => {
    expect(statusDaConversa({ emChamadaComigo: true, emVozNoServidor: false })).toEqual({
      texto: "Em uma chamada",
      tipo: "chamada",
    });
  });

  it("em voz num servidor que compartilhamos", () => {
    expect(statusDaConversa({ emChamadaComigo: false, emVozNoServidor: true })).toEqual({
      texto: "Em voz",
      tipo: "voz",
    });
  });

  /*
    Só acontece num intervalo de milissegundos, entre sair de um lugar e entrar
    no outro. O que importa pra quem lê é a chamada em que ele está envolvido.
  */
  it("estando nos dois, a chamada comigo vence", () => {
    expect(statusDaConversa({ emChamadaComigo: true, emVozNoServidor: true })?.tipo).toBe("chamada");
  });
});
