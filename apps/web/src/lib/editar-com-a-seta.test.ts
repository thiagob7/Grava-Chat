import { describe, expect, it } from "vitest";

import { mensagemParaEditar } from "./editar-com-a-seta";

const eu = "eu";
const minha = (id: string, extra = {}) => ({ id, author: { id: eu }, tipo: "USER", ...extra });
const dela = (id: string) => ({ id, author: { id: "outra" }, tipo: "USER" });

describe("mensagemParaEditar", () => {
  it("abre a última que EU mandei, não a última do canal", () => {
    const alvo = mensagemParaEditar({
      rascunho: "",
      euSou: eu,
      mensagens: [minha("m1"), minha("m2"), dela("d1"), dela("d2")],
    });

    expect(alvo).toBe("m2");
  });

  /*
    Com o campo preenchido a seta é do cursor. Roubá-la quebraria o gesto mais
    básico de edição: subir uma linha num rascunho de vários parágrafos.
  */
  it("não faz nada se já há texto escrito", () => {
    expect(mensagemParaEditar({ rascunho: "oi", euSou: eu, mensagens: [minha("m1")] })).toBeNull();
    expect(mensagemParaEditar({ rascunho: " ", euSou: eu, mensagens: [minha("m1")] })).toBeNull();
  });

  it("ignora mensagem do sistema — o texto foi gerado, não escrito", () => {
    const alvo = mensagemParaEditar({
      rascunho: "",
      euSou: eu,
      mensagens: [minha("m1"), minha("sis", { tipo: "JOIN" })],
    });

    expect(alvo).toBe("m1");
  });

  it("ignora a que ainda está subindo — ela não tem id no servidor", () => {
    const alvo = mensagemParaEditar({
      rascunho: "",
      euSou: eu,
      mensagens: [minha("m1"), minha("m2", { pending: true }), minha("m3", { failed: true })],
    });

    expect(alvo).toBe("m1");
  });

  it("canal sem nada meu não abre nada", () => {
    expect(mensagemParaEditar({ rascunho: "", euSou: eu, mensagens: [dela("d1")] })).toBeNull();
  });

  it("sem sessão carregada, não arrisca", () => {
    expect(mensagemParaEditar({ rascunho: "", euSou: undefined, mensagens: [minha("m1")] })).toBeNull();
  });

  it("canal vazio não quebra", () => {
    expect(mensagemParaEditar({ rascunho: "", euSou: eu, mensagens: [] })).toBeNull();
  });
});
