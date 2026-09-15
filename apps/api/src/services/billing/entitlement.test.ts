import { describe, expect, it } from "vitest";

import { afterPaymentRemoved, afterSubscriptionChange, canRefund } from "./entitlement.js";

const NOW = new Date(Date.UTC(2026, 8, 15, 12));
const DAY = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(NOW.getTime() + days * DAY);

const free = { premiumUntil: null, premiumSource: null };

describe("assinatura mexe no premium", () => {
  it("assinatura ativa libera até o fim do período pago", () => {
    const state = afterSubscriptionChange(free, { status: "active", periodEnd: inDays(30) }, NOW);

    expect(state).toEqual({ premiumUntil: inDays(30), premiumSource: "stripe_subscription" });
  });

  it("não encurta quem já tinha mais dias de outra origem", () => {
    const state = afterSubscriptionChange(
      { premiumUntil: inDays(200), premiumSource: "stripe_pass" },
      { status: "active", periodEnd: inDays(30) },
      NOW,
    );

    expect(state.premiumUntil).toEqual(inDays(200));
  });

  it("pagamento atrasado não empurra a data para o período novo", () => {
    const current = { premiumUntil: inDays(-1), premiumSource: "stripe_subscription" as const };
    const state = afterSubscriptionChange(current, { status: "past_due", periodEnd: inDays(29) }, NOW);

    expect(state).toEqual(current);
  });

  it("assinatura encerrada acaba o premium que veio dela", () => {
    const state = afterSubscriptionChange(
      { premiumUntil: inDays(10), premiumSource: "stripe_subscription" },
      { status: "canceled", periodEnd: inDays(10) },
      NOW,
    );

    expect(state.premiumUntil).toEqual(NOW);
  });

  it("assinatura encerrada não mexe em premium dado no painel", () => {
    const current = { premiumUntil: inDays(10), premiumSource: "grant" as const };
    expect(afterSubscriptionChange(current, { status: "canceled", periodEnd: null }, NOW)).toEqual(current);
  });
});

describe("reembolso e contestação", () => {
  it("reembolso de fatura da assinatura acaba o premium na hora", () => {
    const state = afterPaymentRemoved(
      { premiumUntil: inDays(30), premiumSource: "stripe_subscription" },
      { kind: "subscription", days: null },
      NOW,
    );

    expect(state.premiumUntil).toEqual(NOW);
  });

  it("reembolso de período avulso tira só os dias daquele pagamento", () => {
    const state = afterPaymentRemoved(
      { premiumUntil: inDays(60), premiumSource: "stripe_pass" },
      { kind: "pass", days: 30 },
      NOW,
    );

    expect(state.premiumUntil).toEqual(inDays(30));
  });

  it("nunca deixa a data no passado nem mexe em quem já venceu", () => {
    expect(
      afterPaymentRemoved({ premiumUntil: inDays(5), premiumSource: "stripe_pass" }, { kind: "pass", days: 30 }, NOW)
        .premiumUntil,
    ).toEqual(NOW);

    const expired = { premiumUntil: inDays(-3), premiumSource: "stripe_pass" as const };
    expect(afterPaymentRemoved(expired, { kind: "pass", days: 30 }, NOW)).toEqual(expired);
  });

  it("reembolso só dentro de 7 dias e uma vez", () => {
    expect(canRefund({ paidAt: inDays(-6), refundedAt: null }, NOW)).toBe(true);
    expect(canRefund({ paidAt: inDays(-8), refundedAt: null }, NOW)).toBe(false);
    expect(canRefund({ paidAt: inDays(-1), refundedAt: inDays(-1) }, NOW)).toBe(false);
  });
});
