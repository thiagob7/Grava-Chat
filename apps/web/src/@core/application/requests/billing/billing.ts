import type {
  BillingStatus,
  CardIntent,
  CheckoutInput,
  GiftPreview,
  GiftView,
  PixChargeInput,
  PixChargeView,
} from "@gravae/shared";

import { api } from "~/@core/lib/api";

export const findBilling = async () => (await api.get<BillingStatus>("/billing")).data;

export const startCheckout = async (input: CheckoutInput) =>
  (await api.post<{ url: string }>("/billing/checkout", input)).data;

export const openBillingPortal = async () => (await api.post<{ url: string }>("/billing/portal")).data;

export const requestRefund = async () => (await api.post<BillingStatus>("/billing/refund")).data;

export const createPixCharge = async (input: PixChargeInput) =>
  (await api.post<PixChargeView>("/billing/pix", input)).data;

export const findPixCharge = async (id: string) => (await api.get<PixChargeView>(`/billing/pix/${id}`)).data;

export const findGifts = async () => (await api.get<GiftView[]>("/billing/gifts")).data;

export const claimGift = async (code: string) => (await api.post<GiftView>("/billing/gifts/claim", { code })).data;

export const startCardPayment = async (input: CheckoutInput) =>
  (await api.post<CardIntent>("/billing/card", input)).data;

export const findGiftPreview = async (code: string) => (await api.get<GiftPreview>(`/billing/gifts/${code}`)).data;
