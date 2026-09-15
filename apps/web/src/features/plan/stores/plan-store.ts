import { create } from "zustand";
import { limitsOf, type PlanLimits } from "@gravae/shared";

type PlanStore = {
  premiumUntil: string | null;
  awaitingPaymentSince: number | null;
  upgradeOpen: boolean;
  guildProfileFor: string | null;
  setPremiumUntil: (premiumUntil: string | null) => void;
  awaitPayment: () => void;
  openUpgrade: () => void;
  closeUpgrade: () => void;
  openGuildProfile: (guildId: string) => void;
  closeGuildProfile: () => void;
};

export const usePlanStore = create<PlanStore>((set) => ({
  premiumUntil: null,
  awaitingPaymentSince: null,
  setPremiumUntil: (premiumUntil) => set({ premiumUntil }),
  awaitPayment: () => set({ awaitingPaymentSince: Date.now() }),
  upgradeOpen: false,
  openUpgrade: () => set({ upgradeOpen: true }),
  closeUpgrade: () => set({ upgradeOpen: false }),
  guildProfileFor: null,
  openGuildProfile: (guildId) => set({ guildProfileFor: guildId }),
  closeGuildProfile: () => set({ guildProfileFor: null }),
}));

export const usePlanLimits = (): PlanLimits => limitsOf(usePlanStore((s) => s.premiumUntil));

export const planLimitsNow = (): PlanLimits => limitsOf(usePlanStore.getState().premiumUntil);
