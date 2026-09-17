import type { CardCheck } from "@gravae/shared";

import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";
import { stripe } from "~/lib/stripe.js";
import { billingRepository } from "~/repositories/billing-repository.js";
import { billingEnabled, ensureCustomer, requireStripe } from "./stripe-account.js";

/*
  O presente não cobra nada, mas pede um cartão antes de ativar. O Stripe checa
  o cartão com o banco sem tirar dinheiro — é o mesmo gesto de guardar um cartão
  para usar depois. Serve para não valer a pena abrir conta atrás de conta só
  para resgatar presente.
*/
export const cardCheckService = {
  async start(userId: string): Promise<CardCheck> {
    const client = requireStripe();
    const customer = await ensureCustomer(client, userId);

    const intent = await client.setupIntents.create({
      customer,
      usage: "off_session",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { userId, kind: "gift_check" },
    });

    if (!intent.client_secret) throw new AppError("Não deu para abrir a confirmação do cartão", 502);

    return { clientSecret: intent.client_secret, publishableKey: env.STRIPE_PUBLISHABLE_KEY };
  },

  /*
    Sem Stripe configurado não há o que checar, e o presente não pode ficar
    preso por causa disso: nesse caso a conta conta como já confirmada.
  */
  async hasCardOnFile(userId: string) {
    if (!stripe || !billingEnabled()) return true;

    const customer = await billingRepository.customerOfUser(userId);
    if (!customer) return false;

    const saved = await stripe.paymentMethods
      .list({ customer: customer.stripeCustomerId, type: "card", limit: 1 })
      .catch(() => null);

    return Boolean(saved?.data.length);
  },

  async passed(userId: string, setupIntentId: string) {
    const client = requireStripe();
    const customer = await billingRepository.customerOfUser(userId);
    if (!customer) return false;

    const intent = await client.setupIntents.retrieve(setupIntentId).catch(() => null);
    if (!intent || intent.status !== "succeeded") return false;

    const owner = typeof intent.customer === "string" ? intent.customer : intent.customer?.id;

    return owner === customer.stripeCustomerId && intent.metadata?.userId === userId;
  },
};
