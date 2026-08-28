import { describe, expect, it } from "vitest";

import { ehOutraAba } from "./retomada.js";

const base = { channelId: "c1", clienteId: "aba-1", orphanedAt: null };

describe("ehOutraAba", () => {
  it("recarregar a mesma aba retoma, mesmo com o estado ainda vivo", () => {
    expect(
      ehOutraAba({ retomando: true, anterior: base, canalPedido: "c1", cliente: "aba-1" }),
    ).toBe(false);
  });

  it("uma segunda aba com a chamada viva leva o aviso", () => {
    expect(
      ehOutraAba({ retomando: true, anterior: base, canalPedido: "c1", cliente: "aba-2" }),
    ).toBe(true);
  });

  it("estado já enterrado nunca é outra aba", () => {
    expect(
      ehOutraAba({
        retomando: true,
        anterior: { ...base, orphanedAt: Date.now() },
        canalPedido: "c1",
        cliente: "aba-2",
      }),
    ).toBe(false);
  });

  it("sem estado anterior não há o que disputar", () => {
    expect(
      ehOutraAba({ retomando: true, anterior: null, canalPedido: "c1", cliente: "aba-1" }),
    ).toBe(false);
  });

  it("entrar noutro canal não é retomada", () => {
    expect(
      ehOutraAba({ retomando: true, anterior: base, canalPedido: "c2", cliente: "aba-2" }),
    ).toBe(false);
  });

  it("entrada normal, sem retomada, passa direto", () => {
    expect(
      ehOutraAba({ retomando: false, anterior: base, canalPedido: "c1", cliente: "aba-2" }),
    ).toBe(false);
  });

  /// Sem identidade dos dois lados, sobra o critério antigo — é o que mantém
  /// cliente velho funcionando como funcionava.
  it("sem identidade, decide pelo órfão como antes", () => {
    expect(
      ehOutraAba({ retomando: true, anterior: { ...base, clienteId: null }, canalPedido: "c1", cliente: null }),
    ).toBe(true);
  });
});
