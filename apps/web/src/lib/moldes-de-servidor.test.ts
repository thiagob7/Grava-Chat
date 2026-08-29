import { describe, expect, it } from "vitest";

import { codigoDoConvite, MOLDES } from "./moldes-de-servidor";

describe("codigoDoConvite", () => {
  it("aceita o código digitado sozinho", () => {
    expect(codigoDoConvite("SNxLBdiz")).toBe("SNxLBdiz");
  });

  /*
    Ninguém copia só o código: copia-se a URL inteira. Exigir o código puro
    transformaria um "cola aqui" num exercício de edição de texto.
  */
  it("aceita o link completo", () => {
    expect(codigoDoConvite("https://gravae-chat.vercel.app/invite/SNxLBdiz")).toBe("SNxLBdiz");
  });

  it("aceita link do app de desktop", () => {
    expect(codigoDoConvite("gravae://invite/SNxLBdiz")).toBe("SNxLBdiz");
  });

  it("tolera espaço e quebra de linha grudados na cola", () => {
    expect(codigoDoConvite("  SNxLBdiz\n")).toBe("SNxLBdiz");
  });

  it("descarta query e âncora que vêm do navegador", () => {
    expect(codigoDoConvite("https://gravae-chat.vercel.app/invite/SNxLBdiz?ref=x")).toBe("SNxLBdiz");
    expect(codigoDoConvite("https://gravae-chat.vercel.app/invite/SNxLBdiz#topo")).toBe("SNxLBdiz");
  });

  it("entrada vazia não vira código", () => {
    expect(codigoDoConvite("")).toBeNull();
    expect(codigoDoConvite("   ")).toBeNull();
    expect(codigoDoConvite("///")).toBeNull();
  });
});

describe("MOLDES", () => {
  it("nenhum molde repete o #geral, que o servidor já cria sozinho", () => {
    for (const molde of MOLDES) {
      expect(molde.canais.some((c) => c.nome === "geral")).toBe(false);
    }
  });

  it("todo molde propõe pelo menos um canal a mais", () => {
    for (const molde of MOLDES) expect(molde.canais.length).toBeGreaterThan(0);
  });

  it("os ids são únicos — eles viram chave de React", () => {
    const ids = MOLDES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
