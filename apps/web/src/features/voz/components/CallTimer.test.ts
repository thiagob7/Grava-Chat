import { describe, expect, it } from "vitest";

import { formatDuration } from "./CallTimer";

describe("formatarDuracao", () => {
  it("mostra MM:SS antes de uma hora", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(2_000)).toBe("00:02");
    expect(formatDuration(72_000)).toBe("01:12");
  });

  it("mostra H:MM:SS depois de uma hora", () => {
    expect(formatDuration(3_600_000)).toBe("1:00:00");
    expect(formatDuration(26_930_000)).toBe("7:28:50");
  });

  it("não devolve NaN com entrada inválida", () => {
    expect(formatDuration(NaN)).toBe("00:00");
    expect(formatDuration(-5_000)).toBe("00:00");
  });
});
