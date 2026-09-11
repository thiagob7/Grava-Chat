import { describe, expect, it } from "vitest";

import { messageForEdit } from "./editar-com-a-seta";

const eu = "eu";
const my = (id: string, extra = {}) => ({ id, author: { id: eu }, kind: "USER", ...extra });
const hers = (id: string) => ({ id, author: { id: "outra" }, kind: "USER" });

describe("mensagemParaEditar", () => {
  it("abre a última que EU mandei, não a última do canal", () => {
    const target = messageForEdit({
      draft: "",
      euAm: eu,
      messages: [my("m1"), my("m2"), hers("d1"), hers("d2")],
    });

    expect(target).toBe("m2");
  });

  it("não faz nada se já há texto escrito", () => {
    expect(messageForEdit({ draft: "oi", euAm: eu, messages: [my("m1")] })).toBeNull();
    expect(messageForEdit({ draft: " ", euAm: eu, messages: [my("m1")] })).toBeNull();
  });

  it("ignora mensagem do sistema — o texto foi gerado, não escrito", () => {
    const target = messageForEdit({
      draft: "",
      euAm: eu,
      messages: [my("m1"), my("sis", { kind: "JOIN" })],
    });

    expect(target).toBe("m1");
  });

  it("ignora a que ainda está subindo — ela não tem id no servidor", () => {
    const target = messageForEdit({
      draft: "",
      euAm: eu,
      messages: [my("m1"), my("m2", { pending: true }), my("m3", { failed: true })],
    });

    expect(target).toBe("m1");
  });

  it("canal sem nada meu não abre nada", () => {
    expect(messageForEdit({ draft: "", euAm: eu, messages: [hers("d1")] })).toBeNull();
  });

  it("sem sessão carregada, não arrisca", () => {
    expect(messageForEdit({ draft: "", euAm: undefined, messages: [my("m1")] })).toBeNull();
  });

  it("canal vazio não quebra", () => {
    expect(messageForEdit({ draft: "", euAm: eu, messages: [] })).toBeNull();
  });
});
