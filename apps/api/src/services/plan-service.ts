import { extendPremium, limitsOf, LIMITS, PLAN_LIMITS, type PlanLimits, type PremiumSource } from "@gravae/shared";

import { AppError, ForbiddenError } from "~/lib/http.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

const megabytes = (bytes: number) => Math.round(bytes / (1024 * 1024));

type PlanFeature = { [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never }[keyof PlanLimits];
type PlanCount = "communities" | "savedMessages";

export const premiumRequired = (message: string) => new ForbiddenError(message).having("premium");

export const planService = {
  async limitsOf(userId: string): Promise<PlanLimits> {
    return limitsOf((await userRepository.planInfoOf(userId))?.premiumUntil);
  },

  async requireMessageLength(userId: string, content: string) {
    if (content.length <= PLAN_LIMITS.free.messageLength) return;

    const info = await userRepository.planInfoOf(userId);
    const messageLength = info?.isBot ? LIMITS.messageLength : limitsOf(info?.premiumUntil).messageLength;
    if (content.length > messageLength) {
      throw premiumRequired(`A mensagem passa do limite de ${messageLength} caracteres`);
    }
  },

  async requireAttachmentSize(userId: string, size: number) {
    if (size <= PLAN_LIMITS.free.attachmentBytes) return;

    const { attachmentBytes } = await planService.limitsOf(userId);
    if (size > attachmentBytes) {
      throw premiumRequired(`Arquivo passa do limite de ${megabytes(attachmentBytes)} MB`);
    }
  },

  async hasFeature(userId: string, feature: PlanFeature) {
    return (await planService.limitsOf(userId))[feature];
  },

  async requireFeature(userId: string, feature: PlanFeature, message: string) {
    if (!(await planService.hasFeature(userId, feature))) throw premiumRequired(message);
  },

  async requireRoom(userId: string, count: PlanCount, current: number, message: (limit: number) => string) {
    if (current < PLAN_LIMITS.free[count]) return;

    const limit = (await planService.limitsOf(userId))[count];
    if (current >= limit) throw premiumRequired(message(limit));
  },

  async requireCommunityRoom(userId: string) {
    const current = await memberRepository.countOf(userId);
    await planService.requireRoom(userId, "communities", current, (limit) => `Você já está no limite de ${limit} comunidades`);
  },

  async uploadQuotaOf(userId: string, needed: number) {
    if (needed <= PLAN_LIMITS.free.uploadQuotaByHour) return PLAN_LIMITS.free.uploadQuotaByHour;
    return (await planService.limitsOf(userId)).uploadQuotaByHour;
  },

  async grant(userId: string, days: number, source: PremiumSource) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Conta não encontrada", 404);

    return userRepository.update(userId, {
      premiumUntil: extendPremium(user.premiumUntil, days),
      premiumSource: source,
    });
  },

  async revoke(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Conta não encontrada", 404);

    return userRepository.update(userId, { premiumUntil: null, premiumSource: null });
  },
};
