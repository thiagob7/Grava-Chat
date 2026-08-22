import { describe, expect, it } from "vitest";

import { formatarDuracao } from "./CallTimer";

describe("formatarDuracao", () => {
  it("mostra MM:SS antes de uma hora", () => {
    expect(formatarDuracao(0)).toBe("00:00");
    expect(formatarDuracao(2_000)).toBe("00:02");
    expect(formatarDuracao(72_000)).toBe("01:12");
  });

  it("mostra H:MM:SS depois de uma hora", () => {
    expect(formatarDuracao(3_600_000)).toBe("1:00:00");
    expect(formatarDuracao(26_930_000)).toBe("7:28:50");
  });

  /** Era o bug do "NaN:NaN": estado de voz antigo chegava sem `joinedAt`. */
  it("não devolve NaN com entrada inválida", () => {
    expect(formatarDuracao(NaN)).toBe("00:00");
    expect(formatarDuracao(-5_000)).toBe("00:00");
  });
});
