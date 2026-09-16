import { z } from "zod";

import type { PremiumSource } from "./plans.js";

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const BILLING_RENEWALS = ["automatic", "none"] as const;
export type BillingRenewal = (typeof BILLING_RENEWALS)[number];

export const PASS_DAYS: Record<BillingInterval, number> = { month: 30, year: 365 };

export const PASS_PRICE_CENTS: Record<BillingInterval, number> = { month: 1800, year: 18500 };

export const PIX_CHARGE_STATUSES = ["pending", "paid", "expired"] as const;
export type PixChargeStatus = (typeof PIX_CHARGE_STATUSES)[number];

export const PURCHASE_TARGETS = ["me", "gift"] as const;
export type PurchaseTarget = (typeof PURCHASE_TARGETS)[number];

export const purchaseTarget = z.enum(PURCHASE_TARGETS).default("me");

export const pixChargeInput = z.object({ interval: z.enum(BILLING_INTERVALS), target: purchaseTarget });
export type PixChargeInput = z.infer<typeof pixChargeInput>;

export interface PixChargeView {
  id: string;
  target: PurchaseTarget;
  status: PixChargeStatus;
  interval: BillingInterval;
  amount: number;
  qrCode: string | null;
  qrCodeBase64: string | null;
  expiresAt: string;
}

export const checkoutInput = z.object({
  interval: z.enum(BILLING_INTERVALS),
  renewal: z.enum(BILLING_RENEWALS),
  target: purchaseTarget,
});

export const GIFT_CODE_SIZE = 12;

export const giftCodeInput = z.object({ code: z.string().trim().min(GIFT_CODE_SIZE).max(32) });
export type GiftCodeInput = z.infer<typeof giftCodeInput>;

export const cleanGiftCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const prettyGiftCode = (code: string) => (code.match(/.{1,4}/g) ?? [code]).join("-");

export interface GiftPreview {
  code: string;
  interval: BillingInterval;
  days: number;
  claimed: boolean;
  alreadyPremium: boolean;
  premiumUntil: string | null;
  from: { id: string; displayName: string; avatarUrl: string | null } | null;
}

export interface GiftView {
  code: string;
  interval: BillingInterval;
  days: number;
  amount: number;
  createdAt: string;
  claimedAt: string | null;
  claimedBy: { id: string; displayName: string; avatarUrl: string | null } | null;
}
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
  pixEnabled: boolean;
  publishableKey: string | null;
}

export interface CardIntent {
  clientSecret: string;
  amount: number;
  currency: string;
  mode: "subscription" | "payment";
}
