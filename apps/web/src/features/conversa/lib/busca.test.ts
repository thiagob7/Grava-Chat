import { describe, expect, it } from "vitest";

import { interpretarBusca, temOQueBuscar } from "~/features/conversa/lib/busca";

describe("interpretar a busca", () => {
  it("texto puro é só termo", () => {
    expect(interpretarBusca("bom dia")).toEqual({ termo: "bom dia" });
  });

  it("tira as chaves do termo e guarda cada uma", () => {
    const b = interpretarBusca("from:@thiago in:#geral has:imagem oi before:2026-09-01");

    expect(b.termo).toBe("oi");
    expect(b.from).toBe("thiago");
    expect(b.in).toBe("geral");
    expect(b.has).toBe("imagem");
    expect(b.before).toBe("2026-09-01");
  });

  it("entende sinônimos e ignora valor que não existe", () => {
    expect(interpretarBusca("has:image").has).toBe("imagem");
    expect(interpretarBusca("has:audio").has).toBe("som");
    expect(interpretarBusca("has:banana").has).toBeUndefined();
    expect(interpretarBusca("pinned:sim").pinned).toBe(true);
    expect(interpretarBusca("pinned:false").pinned).toBe(false);
    expect(interpretarBusca("author-type:bot").authorType).toBe("bot");
    expect(interpretarBusca("sort:old").sort).toBe("antiga");
  });

  it("data fora do formato não vale", () => {
    expect(interpretarBusca("on:ontem").on).toBeUndefined();
    expect(interpretarBusca("during:2026-01-02").on).toBe("2026-01-02");
  });

  it("chave desconhecida fica no termo", () => {
    expect(interpretarBusca("foo:bar teste").termo).toBe("foo:bar teste");
  });

  it("filtro sozinho já é busca; uma letra não", () => {
    expect(temOQueBuscar(interpretarBusca("a"))).toBe(false);
    expect(temOQueBuscar(interpretarBusca("ab"))).toBe(true);
    expect(temOQueBuscar(interpretarBusca("has:link"))).toBe(true);
    expect(temOQueBuscar(interpretarBusca("pinned:false"))).toBe(true);
  });
});
