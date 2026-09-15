import type { PremiumAccount } from "@gravae/shared";

import { api } from "~/@core/lib/api";

export const findPremiumAccounts = async (term?: string) =>
  (await api.get<PremiumAccount[]>("/admin/premium", { params: term ? { term } : undefined })).data;

export const grantPremium = async (userId: string, days: number) =>
  (await api.post<PremiumAccount>(`/admin/premium/${userId}`, { days })).data;

export const revokePremium = async (userId: string) =>
  (await api.delete<PremiumAccount>(`/admin/premium/${userId}`)).data;
