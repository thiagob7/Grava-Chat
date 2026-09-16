import type { BillingInterval, CheckoutInput } from "@gravae/shared";

import { env } from "~/env.js";
import { AppError, NotFoundError } from "~/lib/http.js";
import { stripe, type Stripe } from "~/lib/stripe.js";
import { billingRepository } from "~/repositories/billing-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

export const PRICES: Record<CheckoutInput["renewal"], Record<BillingInterval, string>> = {
  automatic: { month: env.STRIPE_PRICE_MONTHLY, year: env.STRIPE_PRICE_YEARLY },
  none: { month: env.STRIPE_PRICE_MONTH_PASS, year: env.STRIPE_PRICE_YEAR_PASS },
};

export const billingEnabled = () =>
  Boolean(stripe && env.STRIPE_WEBHOOK_SECRET && Object.values(PRICES).some((p) => p.month || p.year));

export function requireStripe(): Stripe {
  if (!stripe || !billingEnabled()) throw new AppError("A assinatura ainda não está disponível", 503);
  return stripe;
}

export async function ensureCustomer(client: Stripe, userId: string) {
  const existing = await billingRepository.customerOfUser(userId);
  if (existing) return existing.stripeCustomerId;

  const user = await userRepository.findById(userId);
  if (!user) throw new NotFoundError("Conta não encontrada");

  const customer = await client.customers.create(
    { email: user.email, name: user.displayName, metadata: { userId } },
    { idempotencyKey: `customer-${userId}` },
  );

  await billingRepository.createCustomer(userId, customer.id);
  return customer.id;
}
