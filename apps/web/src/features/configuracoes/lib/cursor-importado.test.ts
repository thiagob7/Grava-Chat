import { describe, expect, it } from "vitest";

import { asRule, dotAllowed } from "~/features/configuracoes/lib/cursor-importado";

const cursor = (image: string) => ({ image, width: 64, height: 64, dotX: 0, dotY: 0 });

describe("regra de cursor", () => {
  it("monta a regra com o ponto de clique e a reserva", () => {
    expect(asRule({ ...cursor("data:image/png;base64,AAA"), dotX: 10, dotY: 4 }, "clicavel")).toBe(
      'url("data:image/png;base64,AAA") 10 4, pointer',
    );
  });

  it("aceita o arquivo servido pelo próprio app", () => {
    expect(asRule(cursor("/assets/cursores/seta.png"), "padrao")).toBe(
      'url("/assets/cursores/seta.png") 0 0, default',
    );
  });

  it("recusa endereço que fecharia o url e escreveria CSS", () => {
    expect(asRule(cursor('/a.png") 0 0, pointer; color: red; --x: url("'), "clicavel")).toBeNull();
    expect(asRule(cursor("javascript:alert(1)"), "clicavel")).toBeNull();
    expect(asRule(cursor(""), "clicavel")).toBeNull();
  });

  it("prende o ponto de clique dentro da metade da imagem", () => {
    expect(dotAllowed(999, 64)).toBe(32);
    expect(dotAllowed(-5, 64)).toBe(0);
  });
});
