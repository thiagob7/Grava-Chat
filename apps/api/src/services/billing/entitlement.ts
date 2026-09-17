import type { PremiumSource } from "@gravae/shared";

export const REFUND_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export const PAYING_STATUSES = new Set(["active", "trialing"]);

export const ENDED_STATUSES = new Set(["canceled", "unpaid", "incomplete_expired"]);

export interface PremiumState {
  premiumUntil: Date | null;
  premiumSource: PremiumSource | null;
}

export function afterSubscriptionChange(
  current: PremiumState,
  subscription: { status: string; periodEnd: Date | null },
  now: Date = new Date(),
): PremiumState {
  if (PAYING_STATUSES.has(subscription.status) && subscription.periodEnd) {
    const until =
      current.premiumUntil && current.premiumUntil > subscription.periodEnd ? current.premiumUntil : subscription.periodEnd;

    return { premiumUntil: until, premiumSource: "stripe_subscription" };
  }

  if (ENDED_STATUSES.has(subscription.status) && current.premiumSource === "stripe_subscription") {
    const until = current.premiumUntil && current.premiumUntil < now ? current.premiumUntil : now;
    return { premiumUntil: until, premiumSource: current.premiumSource };
  }

  return current;
}

export function afterPaymentRemoved(
  current: PremiumState,
  payment: { kind: string; days: number | null },
  now: Date = new Date(),
): PremiumState {
  if (!current.premiumUntil || current.premiumUntil <= now) return current;

  if (payment.kind === "subscription") {
    return { premiumUntil: now, premiumSource: current.premiumSource };
  }

  const shortened = new Date(current.premiumUntil.getTime() - (payment.days ?? 0) * DAY_MS);
  return { premiumUntil: shortened > now ? shortened : now, premiumSource: current.premiumSource };
}

export const refundOpenUntil = (paidAt: Date) => new Date(paidAt.getTime() + REFUND_WINDOW_DAYS * DAY_MS);

export const canRefund = (payment: { paidAt: Date; refundedAt: Date | null }, now: Date = new Date()) =>
  !payment.refundedAt && refundOpenUntil(payment.paidAt) > now;
