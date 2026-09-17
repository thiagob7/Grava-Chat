import type {
  BillingStatus,
  CardCheck,
  CardIntent,
  CheckoutInput,
  GiftPreview,
  GiftView,
  PixChargeInput,
  PixChargeView,
  PublicGiftView,
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

export const claimGift = async (input: { code: string; setupIntentId?: string }) =>
  (await api.post<GiftView>("/billing/gifts/claim", input)).data;

export const startCardCheck = async () => (await api.post<CardCheck>("/billing/card-check")).data;

export const startCardPayment = async (input: CheckoutInput) =>
  (await api.post<CardIntent>("/billing/card", input)).data;

export const findGiftPreview = async (code: string) => (await api.get<GiftPreview>(`/billing/gifts/${code}`)).data;

export const findPublicGift = async (code: string) => (await api.get<PublicGiftView>(`/gifts/${code}`)).data;
