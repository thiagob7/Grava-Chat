import type { BillingStatus, CheckoutInput } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export const findBilling = async () => (await api.get<BillingStatus>("/billing")).data;

export const startCheckout = async (input: CheckoutInput) =>
  (await api.post<{ url: string }>("/billing/checkout", input)).data;

export const openBillingPortal = async () => (await api.post<{ url: string }>("/billing/portal")).data;

export const requestRefund = async () => (await api.post<BillingStatus>("/billing/refund")).data;
