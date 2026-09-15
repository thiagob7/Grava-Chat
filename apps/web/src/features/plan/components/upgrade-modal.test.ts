import { describe, expect, it } from "vitest";

import { yearlySavingPercent } from "./UpgradeModal";

const price = (amount: number, currency = "brl") => ({ amount, currency });

describe("desconto do anual", () => {
  it("compara o anual com doze mensalidades", () => {
    const prices = {
      automatic: { month: price(1890), year: price(18900) },
      none: { month: null, year: null },
    };

    expect(yearlySavingPercent(prices)).toBe(17);
  });

  it("usa o preço avulso quando não há assinatura", () => {
    const prices = {
      automatic: { month: null, year: null },
      none: { month: price(2000), year: price(20000) },
    };

    expect(yearlySavingPercent(prices)).toBe(17);
  });

  it("sem desconto, moedas diferentes ou preço faltando não mostra selo", () => {
    expect(yearlySavingPercent({ automatic: { month: price(1000), year: price(12000) }, none: { month: null, year: null } })).toBeNull();
    expect(yearlySavingPercent({ automatic: { month: price(1000), year: price(9000, "usd") }, none: { month: null, year: null } })).toBeNull();
    expect(yearlySavingPercent({ automatic: { month: price(1000), year: null }, none: { month: null, year: null } })).toBeNull();
    expect(yearlySavingPercent(null)).toBeNull();
  });
});
