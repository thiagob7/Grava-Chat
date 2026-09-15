import { z } from "zod";

import type { PremiumSource } from "./plans.js";

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const BILLING_RENEWALS = ["automatic", "none"] as const;
export type BillingRenewal = (typeof BILLING_RENEWALS)[number];

export const PASS_DAYS: Record<BillingInterval, number> = { month: 30, year: 365 };

export const checkoutInput = z.object({
  interval: z.enum(BILLING_INTERVALS),
  renewal: z.enum(BILLING_RENEWALS),
});
export type CheckoutInput = z.infer<typeof checkoutInput>;

export interface BillingPrice {
  amount: number;
  currency: string;
}

export type BillingPrices = Record<BillingRenewal, Record<BillingInterval, BillingPrice | null>>;

export interface BillingStatus {
  enabled: boolean;
  premiumUntil: string | null;
  premiumSource: PremiumSource | null;
  subscription: {
    status: string;
    interval: BillingInterval | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  refund: { amount: number; currency: string; openUntil: string } | null;
  canManage: boolean;
  prices: BillingPrices | null;
}
