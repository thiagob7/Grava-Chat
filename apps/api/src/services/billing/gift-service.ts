import { extendPremium, planOf, prettyGiftCode, type BillingInterval, type GiftPreview, type GiftView } from "@gravae/shared";

import { AppError, NotFoundError } from "~/lib/http.js";
import { newGiftCode } from "~/lib/gift-code.js";
import { announceUserUpdated } from "~/realtime/difusao.js";
import { billingRepository } from "~/repositories/billing-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

type GiftRow = NonNullable<Awaited<ReturnType<typeof billingRepository.giftByCode>>>;

async function toView(gift: GiftRow): Promise<GiftView> {
  const claimer = gift.claimedById ? await userRepository.findById(gift.claimedById) : null;

  return {
    code: prettyGiftCode(gift.code),
    interval: gift.interval as BillingInterval,
    days: gift.days,
    amount: gift.amount,
    createdAt: gift.createdAt.toISOString(),
    claimedAt: gift.claimedAt?.toISOString() ?? null,
    claimedBy: claimer
      ? { id: claimer.id, displayName: claimer.displayName, avatarUrl: claimer.avatarUrl }
      : null,
  };
}

export const giftService = {
  async create(input: { buyerId: string; sourceId: string; interval: string; days: number; amount: number }) {
    const existing = await billingRepository.giftBySource(input.sourceId);
    if (existing) return existing;

    return billingRepository.createGift({ ...input, code: newGiftCode() });
  },

  async mine(buyerId: string): Promise<GiftView[]> {
    const gifts = await billingRepository.giftsOf(buyerId);
    return Promise.all(gifts.map(toView));
  },

  async preview(userId: string, rawCode: string): Promise<GiftPreview> {
    const gift = await billingRepository.giftByCode(rawCode);
    if (!gift) throw new NotFoundError("Código de presente não encontrado");

    const user = await userRepository.findById(userId);
    const buyer = await userRepository.findById(gift.buyerId);

    return {
      code: prettyGiftCode(gift.code),
      interval: gift.interval as BillingInterval,
      days: gift.days,
      claimed: Boolean(gift.claimedAt),
      alreadyPremium: planOf(user?.premiumUntil) === "premium",
      premiumUntil: user?.premiumUntil?.toISOString() ?? null,
      from: buyer ? { id: buyer.id, displayName: buyer.displayName, avatarUrl: buyer.avatarUrl } : null,
    };
  },

  async claim(userId: string, rawCode: string): Promise<GiftView> {
    const gift = await billingRepository.giftByCode(rawCode);
    if (!gift) throw new NotFoundError("Código de presente não encontrado");
    if (gift.claimedAt) throw new AppError("Esse presente já foi resgatado", 409);

    const person = await userRepository.findById(userId);
    if (planOf(person?.premiumUntil) === "premium") {
      throw new AppError("Você já tem o Infinity ativo. Guarde o link para dar a um amigo.", 409);
    }

    const { count } = await billingRepository.claimGift(gift.id, userId, new Date());
    if (!count) throw new AppError("Esse presente já foi resgatado", 409);

    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("Conta não encontrada");

    const updated = await userRepository.update(userId, {
      premiumUntil: extendPremium(user.premiumUntil, gift.days),
      premiumSource: user.premiumSource === "stripe_subscription" ? user.premiumSource : "gift",
    });

    await announceUserUpdated(updated);

    return toView({ ...gift, claimedById: userId, claimedAt: new Date() });
  },
};
