import { describe, expect, it } from "vitest";

import { parseSearch, hasSearch } from "~/features/conversa/lib/busca";

describe("interpretar a busca", () => {
  it("texto puro é só termo", () => {
    expect(parseSearch("bom dia")).toEqual({ term: "bom dia" });
  });

  it("tira as chaves do termo e guarda cada uma", () => {
    const b = parseSearch("from:@thiago in:#geral has:imagem oi before:2026-09-01");

    expect(b.term).toBe("oi");
    expect(b.from).toBe("thiago");
    expect(b.in).toBe("geral");
    expect(b.has).toBe("imagem");
    expect(b.before).toBe("2026-09-01");
  });

  it("entende sinônimos e ignora valor que não existe", () => {
    expect(parseSearch("has:image").has).toBe("imagem");
    expect(parseSearch("has:audio").has).toBe("som");
    expect(parseSearch("has:banana").has).toBeUndefined();
    expect(parseSearch("pinned:sim").pinned).toBe(true);
    expect(parseSearch("pinned:false").pinned).toBe(false);
    expect(parseSearch("author-type:bot").authorType).toBe("bot");
    expect(parseSearch("sort:old").sort).toBe("antiga");
  });

  it("data fora do formato não vale", () => {
    expect(parseSearch("on:ontem").on).toBeUndefined();
    expect(parseSearch("during:2026-01-02").on).toBe("2026-01-02");
  });

  it("chave desconhecida fica no termo", () => {
    expect(parseSearch("foo:bar teste").term).toBe("foo:bar teste");
  });

  it("filtro sozinho já é busca; uma letra não", () => {
    expect(hasSearch(parseSearch("a"))).toBe(false);
    expect(hasSearch(parseSearch("ab"))).toBe(true);
    expect(hasSearch(parseSearch("has:link"))).toBe(true);
    expect(hasSearch(parseSearch("pinned:false"))).toBe(true);
  });
});
