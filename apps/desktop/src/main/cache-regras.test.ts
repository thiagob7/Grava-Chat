import { describe, expect, it } from "vitest";

import { accountFile, cutOff, pageSize, whenIn, KEEP_DAYS } from "./cache-regras";

describe("nome do arquivo por conta", () => {
  it("id do Mongo vira arquivo", () => {
    expect(accountFile("6a8781da7415b08f427be1a4")).toBe("6a8781da7415b08f427be1a4.db");
  });

  it("maiúscula desce, para não virar dois arquivos no mesmo Mac", () => {
    expect(accountFile("6A8781DA7415B08F427BE1A4")).toBe("6a8781da7415b08f427be1a4.db");
  });

  it("caminho disfarçado de id não vira arquivo", () => {
    expect(accountFile("../../etc/passwd")).toBeNull();
    expect(accountFile("6a8781da7415b08f427be1a4/../x")).toBeNull();
    expect(accountFile("")).toBeNull();
    expect(accountFile("nao-e-hexadecimal-de-24")).toBeNull();
  });
});

describe("corte da poda", () => {
  it("corta noventa dias atrás", () => {
    const agora = Date.parse("2026-09-12T00:00:00Z");
    expect(cutOff(agora)).toBe(agora - KEEP_DAYS * 86_400_000);
  });
});

describe("tamanho de página", () => {
  it("sem pedido, usa o padrão", () => {
    expect(pageSize(undefined)).toBe(50);
  });

  it("pedido absurdo encosta no teto", () => {
    expect(pageSize(99_999)).toBe(200);
  });

  it("zero e negativo viram um, não viram consulta sem limite", () => {
    expect(pageSize(0)).toBe(50);
    expect(pageSize(-10)).toBe(1);
  });
});

describe("data que vai para a coluna", () => {
  it("texto ISO vira número", () => {
    expect(whenIn("2026-09-12T10:00:00.000Z")).toBe(Date.parse("2026-09-12T10:00:00.000Z"));
  });

  it("número passa direto", () => {
    expect(whenIn(1_700_000_000_000)).toBe(1_700_000_000_000);
  });

  it("lixo vira zero em vez de derrubar a escrita", () => {
    expect(whenIn("ontem")).toBe(0);
    expect(whenIn(null)).toBe(0);
    expect(whenIn(undefined)).toBe(0);
    expect(whenIn(Number.NaN)).toBe(0);
  });
});
