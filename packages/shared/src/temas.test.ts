import { describe, expect, it } from "vitest";

import {
  comCabecalho,
  escreverCabecalhoDoTema,
  idDoTemaNoLink,
  lerCabecalhoDoTema,
} from "./temas.js";

const EXEMPLO = `/**
 * @name Quiet System Gruvbox
 * @description based on system24 by refact0r
 * @author BEQUIETBRO
 * @version 1.0.0
 * @tags liquid glass, modern, customizable, gruvbox
 */

body { background: #282828; }`;

describe("cabecalho do tema", () => {
  it("le os cinco campos do bloco", () => {
    const cabecalho = lerCabecalhoDoTema(EXEMPLO);

    expect(cabecalho.nome).toBe("Quiet System Gruvbox");
    expect(cabecalho.autor).toBe("BEQUIETBRO");
    expect(cabecalho.versao).toBe("1.0.0");
    expect(cabecalho.tags).toEqual(["liquid glass", "modern", "customizable", "gruvbox"]);
  });

  it("devolve tudo vazio quando o css nao tem bloco", () => {
    expect(lerCabecalhoDoTema("body { color: red; }").nome).toBeNull();
    expect(lerCabecalhoDoTema("body { color: red; }").tags).toEqual([]);
  });

  it("ignora bloco que nao esta no topo", () => {
    expect(lerCabecalhoDoTema("body{}\n/**\n * @name Tarde\n */").nome).toBeNull();
  });

  it("nao se perde com comentario comum de uma estrela", () => {
    expect(lerCabecalhoDoTema("/* @name Nao vale */\nbody{}").nome).toBeNull();
  });

  it("aceita campo sem asterisco na frente", () => {
    expect(lerCabecalhoDoTema("/**\n@name Solto\n*/").nome).toBe("Solto");
  });

  it("corta tag vazia e limita a oito", () => {
    const muitas = lerCabecalhoDoTema(
      "/**\n * @tags a, , b, c, d, e, f, g, h, i, j\n */",
    );

    expect(muitas.tags).toHaveLength(8);
    expect(muitas.tags).not.toContain("");
  });

  it("volta a escrever o bloco que leu", () => {
    const cabecalho = lerCabecalhoDoTema(EXEMPLO);
    const escrito = escreverCabecalhoDoTema(cabecalho);

    expect(lerCabecalhoDoTema(escrito)).toEqual(cabecalho);
  });

  it("nao escreve bloco quando nao ha nada para dizer", () => {
    expect(
      escreverCabecalhoDoTema({
        nome: null,
        descricao: null,
        autor: null,
        versao: null,
        tags: [],
      }),
    ).toBe("");
  });

  it("troca o cabecalho em vez de empilhar outro", () => {
    const trocado = comCabecalho(EXEMPLO, {
      nome: "Outro",
      descricao: null,
      autor: null,
      versao: null,
      tags: [],
    });

    expect(lerCabecalhoDoTema(trocado).nome).toBe("Outro");
    expect(trocado.match(/@name/g)).toHaveLength(1);
    expect(trocado).toContain("background: #282828");
  });
});

describe("link de tema", () => {
  const origem = "https://gravae-chat.vercel.app";

  it("acha o id no link do proprio app", () => {
    expect(idDoTemaNoLink(`${origem}/tema/6a9c1970588464cf66fa7161`, origem)).toBe(
      "6a9c1970588464cf66fa7161",
    );
  });

  it("recusa link de outro site", () => {
    expect(idDoTemaNoLink("https://outro.com/tema/6a9c1970588464cf66fa7161", origem)).toBeNull();
  });

  it("recusa id que nao e de objeto", () => {
    expect(idDoTemaNoLink(`${origem}/tema/abc`, origem)).toBeNull();
  });

  it("nao estoura com texto que nao e url", () => {
    expect(idDoTemaNoLink("nem url isso é", origem)).toBeNull();
  });
});
