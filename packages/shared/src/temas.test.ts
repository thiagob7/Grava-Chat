import { describe, expect, it } from "vitest";

import {
  withHeader,
  writeThemeHeader,
  themeLinkId,
  readThemeHeader,
} from "./temas.js";

const EXAMPLE = `/**
 * @name Quiet System Gruvbox
 * @description based on system24 by refact0r
 * @author BEQUIETBRO
 * @version 1.0.0
 * @tags liquid glass, modern, customizable, gruvbox
 */

body { background: #282828; }`;

describe("cabecalho do tema", () => {
  it("le os cinco campos do bloco", () => {
    const header = readThemeHeader(EXAMPLE);

    expect(header.name).toBe("Quiet System Gruvbox");
    expect(header.author).toBe("BEQUIETBRO");
    expect(header.version).toBe("1.0.0");
    expect(header.tags).toEqual(["liquid glass", "modern", "customizable", "gruvbox"]);
  });

  it("devolve tudo vazio quando o css nao tem bloco", () => {
    expect(readThemeHeader("body { color: red; }").name).toBeNull();
    expect(readThemeHeader("body { color: red; }").tags).toEqual([]);
  });

  it("ignora bloco que nao esta no topo", () => {
    expect(readThemeHeader("body{}\n/**\n * @name Tarde\n */").name).toBeNull();
  });

  it("nao se perde com comentario comum de uma estrela", () => {
    expect(readThemeHeader("/* @name Nao vale */\nbody{}").name).toBeNull();
  });

  it("aceita campo sem asterisco na frente", () => {
    expect(readThemeHeader("/**\n@name Solto\n*/").name).toBe("Solto");
  });

  it("corta tag vazia e limita a oito", () => {
    const many = readThemeHeader(
      "/**\n * @tags a, , b, c, d, e, f, g, h, i, j\n */",
    );

    expect(many.tags).toHaveLength(8);
    expect(many.tags).not.toContain("");
  });

  it("volta a escrever o bloco que leu", () => {
    const header = readThemeHeader(EXAMPLE);
    const written = writeThemeHeader(header);

    expect(readThemeHeader(written)).toEqual(header);
  });

  it("nao escreve bloco quando nao ha nada para dizer", () => {
    expect(
      writeThemeHeader({
        name: null,
        description: null,
        author: null,
        version: null,
        font: null,
        invite: null,
        tags: [],
      }),
    ).toBe("");
  });

  it("troca o cabecalho em vez de empilhar outro", () => {
    const swapped = withHeader(EXAMPLE, {
      name: "Outro",
      description: null,
      author: null,
      version: null,
      font: null,
      invite: null,
      tags: [],
    });

    expect(readThemeHeader(swapped).name).toBe("Outro");
    expect(swapped.match(/@name/g)).toHaveLength(1);
    expect(swapped).toContain("background: #282828");
  });
});

describe("link de tema", () => {
  const origin = "https://gravae-chat.vercel.app";

  it("acha o id no link do proprio app", () => {
    expect(themeLinkId(`${origin}/tema/6a9c1970588464cf66fa7161`, origin)).toBe(
      "6a9c1970588464cf66fa7161",
    );
  });

  it("recusa link de outro site", () => {
    expect(themeLinkId("https://outro.com/tema/6a9c1970588464cf66fa7161", origin)).toBeNull();
  });

  it("aceita o tema copiado de outro ambiente nosso", () => {
    expect(
      themeLinkId("https://gravae-chat.vercel.app/tema/6a9c1970588464cf66fa7161", [
        "http://localhost:5173",
        "https://gravae-chat.vercel.app",
      ]),
    ).toBe("6a9c1970588464cf66fa7161");
  });

  it("recusa id que nao e de objeto", () => {
    expect(themeLinkId(`${origin}/tema/abc`, origin)).toBeNull();
  });

  it("nao estoura com texto que nao e url", () => {
    expect(themeLinkId("nem url isso é", origin)).toBeNull();
  });
});

describe("endereco no cabecalho", () => {
  it("guarda a fonte e o convite quando sao https", () => {
    const read = readThemeHeader(
      [
        "/**",
        " * @name Azul",
        " * @updateUrl https://gravae.io/temas/azul.css",
        " * @invite https://gravae.io/convite/abc",
        " */",
      ].join("\n"),
    );

    expect(read.font).toBe("https://gravae.io/temas/azul.css");
    expect(read.invite).toBe("https://gravae.io/convite/abc");
  });

  it("recusa endereco que nao seja https", () => {
    const read = readThemeHeader(
      ["/**", " * @updateUrl javascript:alert(1)", " * @invite http://gravae.io/x", " */"].join(
        "\n",
      ),
    );

    expect(read.font).toBeNull();
    expect(read.invite).toBeNull();
  });
});
