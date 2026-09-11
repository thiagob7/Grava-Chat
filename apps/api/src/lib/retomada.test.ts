import { describe, expect, it } from "vitest";

import { isOtherTab } from "./retomada.js";

const base = { channelId: "c1", clientId: "aba-1", orphanedAt: null };

describe("ehOutraAba", () => {
  it("recarregar a mesma aba retoma, mesmo com o estado ainda vivo", () => {
    expect(
      isOtherTab({ resuming: true, anterior: base, channelRequest: "c1", client: "aba-1" }),
    ).toBe(false);
  });

  it("uma segunda aba com a chamada viva leva o aviso", () => {
    expect(
      isOtherTab({ resuming: true, anterior: base, channelRequest: "c1", client: "aba-2" }),
    ).toBe(true);
  });

  it("estado já enterrado nunca é outra aba", () => {
    expect(
      isOtherTab({
        resuming: true,
        anterior: { ...base, orphanedAt: Date.now() },
        channelRequest: "c1",
        client: "aba-2",
      }),
    ).toBe(false);
  });

  it("sem estado anterior não há o que disputar", () => {
    expect(
      isOtherTab({ resuming: true, anterior: null, channelRequest: "c1", client: "aba-1" }),
    ).toBe(false);
  });

  it("entrar noutro canal não é retomada", () => {
    expect(
      isOtherTab({ resuming: true, anterior: base, channelRequest: "c2", client: "aba-2" }),
    ).toBe(false);
  });

  it("entrada normal, sem retomada, passa direto", () => {
    expect(
      isOtherTab({ resuming: false, anterior: base, channelRequest: "c1", client: "aba-2" }),
    ).toBe(false);
  });

  it("sem identidade, decide pelo órfão como antes", () => {
    expect(
      isOtherTab({ resuming: true, anterior: { ...base, clientId: null }, channelRequest: "c1", client: null }),
    ).toBe(true);
  });
});
