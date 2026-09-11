import { describe, expect, it } from "vitest";

import { inviteCode, MOLDS } from "./moldes-de-servidor";

describe("codigoDoConvite", () => {
  it("aceita o código digitado sozinho", () => {
    expect(inviteCode("SNxLBdiz")).toBe("SNxLBdiz");
  });

  it("aceita o link completo", () => {
    expect(inviteCode("https://gravae-chat.vercel.app/invite/SNxLBdiz")).toBe("SNxLBdiz");
  });

  it("aceita link do app de desktop", () => {
    expect(inviteCode("gravae://invite/SNxLBdiz")).toBe("SNxLBdiz");
  });

  it("tolera espaço e quebra de linha grudados na cola", () => {
    expect(inviteCode("  SNxLBdiz\n")).toBe("SNxLBdiz");
  });

  it("descarta query e âncora que vêm do navegador", () => {
    expect(inviteCode("https://gravae-chat.vercel.app/invite/SNxLBdiz?ref=x")).toBe("SNxLBdiz");
    expect(inviteCode("https://gravae-chat.vercel.app/invite/SNxLBdiz#topo")).toBe("SNxLBdiz");
  });

  it("entrada vazia não vira código", () => {
    expect(inviteCode("")).toBeNull();
    expect(inviteCode("   ")).toBeNull();
    expect(inviteCode("///")).toBeNull();
  });
});

describe("MOLDES", () => {
  it("nenhum molde repete o #geral, que o servidor já cria sozinho", () => {
    for (const mold of MOLDS) {
      expect(mold.channels.some((c) => c.name === "geral")).toBe(false);
    }
  });

  it("todo molde propõe pelo menos um canal a mais", () => {
    for (const mold of MOLDS) expect(mold.channels.length).toBeGreaterThan(0);
  });

  it("os ids são únicos — eles viram chave de React", () => {
    const ids = MOLDS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
