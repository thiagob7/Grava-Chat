import { describe, expect, it } from "vitest";

import { extendPremium, HIGHEST_LIMITS, limitsOf, PLAN_LIMITS, planOf } from "./plans.js";

const NOW = Date.UTC(2026, 8, 15, 12);
const DAY = 24 * 60 * 60 * 1000;

describe("plano da conta", () => {
  it("sem data ou com data passada é grátis", () => {
    expect(planOf(null, NOW)).toBe("free");
    expect(planOf(undefined, NOW)).toBe("free");
    expect(planOf(new Date(NOW - 1), NOW)).toBe("free");
    expect(planOf(new Date(NOW), NOW)).toBe("free");
  });

  it("com data futura é premium, venha como Date ou como texto", () => {
    expect(planOf(new Date(NOW + DAY), NOW)).toBe("premium");
    expect(planOf(new Date(NOW + DAY).toISOString(), NOW)).toBe("premium");
  });

  it("data estragada não vira premium", () => {
    expect(planOf("amanhã", NOW)).toBe("free");
  });

  it("o grátis segue a tabela combinada", () => {
    const free = limitsOf(null, NOW);

    expect(free.messageLength).toBe(2000);
    expect(free.attachmentBytes).toBe(25 * 1024 * 1024);
    expect(free.screenResolutions).toEqual(["480", "720"]);
    expect(free.screenFrameRates).toEqual([15, 30]);
  });

  it("o premium nunca tem menos que o grátis", () => {
    const { free, premium } = PLAN_LIMITS;

    expect(premium.messageLength).toBeGreaterThan(free.messageLength);
    expect(premium.attachmentBytes).toBeGreaterThan(free.attachmentBytes);
    expect(premium.communities).toBeGreaterThan(free.communities);
    expect(premium.savedMessages).toBeGreaterThan(free.savedMessages);
    expect(free.screenResolutions.every((r) => premium.screenResolutions.includes(r))).toBe(true);
    expect(free.screenFrameRates.every((f) => premium.screenFrameRates.includes(f))).toBe(true);
  });

  it("o teto geral é o maior entre os planos", () => {
    expect(HIGHEST_LIMITS.messageLength).toBe(PLAN_LIMITS.premium.messageLength);
    expect(HIGHEST_LIMITS.attachmentBytes).toBe(PLAN_LIMITS.premium.attachmentBytes);
  });
});

describe("somar dias de premium", () => {
  it("quem não tem começa a contar de agora", () => {
    expect(extendPremium(null, 30, NOW).getTime()).toBe(NOW + 30 * DAY);
  });

  it("quem já tem soma a partir do fim atual", () => {
    const until = new Date(NOW + 10 * DAY);
    expect(extendPremium(until, 30, NOW).getTime()).toBe(NOW + 40 * DAY);
  });

  it("quem venceu recomeça de agora, sem ganhar os dias que passaram", () => {
    const until = new Date(NOW - 10 * DAY);
    expect(extendPremium(until, 30, NOW).getTime()).toBe(NOW + 30 * DAY);
  });
});
