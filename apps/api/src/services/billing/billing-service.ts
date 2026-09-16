import {
  PASS_DAYS,
  extendPremium,
  type BillingInterval,
  type BillingPrices,
  type BillingStatus,
  type PurchaseTarget,
  type CheckoutInput,
  type PremiumSource,
} from "@gravae/shared";

import { env } from "~/env.js";
import { AppError, NotFoundError } from "~/lib/http.js";
import { mercadoPagoEnabled, refundOrder, refundPayment } from "~/lib/mercadopago.js";
import { stripe, type Stripe } from "~/lib/stripe.js";
import { announceUserUpdated } from "~/realtime/difusao.js";
import { billingRepository } from "~/repositories/billing-repository.js";
import { giftService } from "./gift-service.js";
import { userRepository } from "~/repositories/user-repository.js";
import {
  ENDED_STATUSES,
  afterPaymentRemoved,
  afterSubscriptionChange,
  canRefund,
  refundOpenUntil,
  type PremiumState,
} from "./entitlement.js";

const CHECKOUT_FLOWS = {
  subscription: "premium-subscription-KQWMZRTH",
  pass: "premium-pass-PLXNVDSA",
};

const PRICES: Record<CheckoutInput["renewal"], Record<BillingInterval, string>> = {
  automatic: { month: env.STRIPE_PRICE_MONTHLY, year: env.STRIPE_PRICE_YEARLY },
  none: { month: env.STRIPE_PRICE_MONTH_PASS, year: env.STRIPE_PRICE_YEAR_PASS },
};

const webBase = () => env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";

export const billingEnabled = () =>
  Boolean(stripe && env.STRIPE_WEBHOOK_SECRET && Object.values(PRICES).some((p) => p.month || p.year));

function requireStripe(): Stripe {
  if (!stripe || !billingEnabled()) throw new AppError("A assinatura ainda não está disponível", 503);
  return stripe;
}

export const mercadoPagoPaymentOf = (sourceId: string) => (sourceId.startsWith("mp:") ? sourceId.slice(3) : null);

export const mercadoPagoOrderOf = (sourceId: string) => (sourceId.startsWith("mpo:") ? sourceId.slice(4) : null);

const refundable = (payment: { paymentIntentId: string | null; sourceId: string }) =>
  Boolean(payment.paymentIntentId || mercadoPagoPaymentOf(payment.sourceId) || mercadoPagoOrderOf(payment.sourceId));

const toDate = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000) : null);

const stateOf = (user: { premiumUntil: Date | null; premiumSource: string | null }): PremiumState => ({
  premiumUntil: user.premiumUntil,
  premiumSource: user.premiumSource as PremiumSource | null,
});

async function savePremium(userId: string, change: (current: PremiumState) => PremiumState) {
  const user = await userRepository.findById(userId);
  if (!user) return null;

  const current = stateOf(user);
  const next = change(current);

  if (next.premiumUntil?.getTime() === current.premiumUntil?.getTime() && next.premiumSource === current.premiumSource) {
    return user;
  }

  const updated = await userRepository.update(userId, next);
  await announceUserUpdated(updated);
  return updated;
}

async function ensureCustomer(client: Stripe, userId: string) {
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

const PRICES_TTL_MS = 10 * 60 * 1000;
let pricesCache: { at: number; value: BillingPrices } | null = null;

async function loadPrices(): Promise<BillingPrices | null> {
  if (!stripe || !billingEnabled()) return null;
  if (pricesCache && Date.now() - pricesCache.at < PRICES_TTL_MS) return pricesCache.value;

  const one = async (id: string) => {
    if (!id) return null;
    const price = await stripe!.prices.retrieve(id).catch(() => null);
    return price?.active && price.unit_amount !== null ? { amount: price.unit_amount, currency: price.currency } : null;
  };

  const [monthly, yearly, monthPass, yearPass] = await Promise.all([
    one(PRICES.automatic.month),
    one(PRICES.automatic.year),
    one(PRICES.none.month),
    one(PRICES.none.year),
  ]);

  const value = { automatic: { month: monthly, year: yearly }, none: { month: monthPass, year: yearPass } };
  pricesCache = { at: Date.now(), value };
  return value;
}

const periodEndOf = (subscription: Stripe.Subscription) =>
  toDate(Math.max(0, ...subscription.items.data.map((item) => item.current_period_end)));

export const billingService = {
  async status(userId: string): Promise<BillingStatus> {
    const [user, customer, latest, prices] = await Promise.all([
      userRepository.findById(userId),
      billingRepository.customerOfUser(userId),
      billingRepository.latestPayment(userId),
      loadPrices(),
    ]);
    if (!user) throw new NotFoundError("Conta não encontrada");

    const live = customer?.subscriptionId && !ENDED_STATUSES.has(customer.subscriptionStatus ?? "");

    return {
      enabled: billingEnabled(),
      premiumUntil: user.premiumUntil?.toISOString() ?? null,
      premiumSource: stateOf(user).premiumSource,
      subscription: live
        ? {
            status: customer.subscriptionStatus ?? "incomplete",
            interval: (customer.interval as BillingInterval | null) ?? null,
            currentPeriodEnd: customer.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: customer.cancelAtPeriodEnd,
          }
        : null,
      refund:
        latest && refundable(latest) && canRefund(latest)
          ? { amount: latest.amount, currency: latest.currency, openUntil: refundOpenUntil(latest.paidAt).toISOString() }
          : null,
      canManage: Boolean(customer),
      prices,
      pixEnabled: mercadoPagoEnabled(),
    };
  },

  async checkout(userId: string, input: CheckoutInput) {
    const client = requireStripe();
    const price = PRICES[input.renewal][input.interval];
    if (!price) throw new AppError("Esse plano não está disponível", 400);

    if (input.renewal === "automatic") {
      const customer = await billingRepository.customerOfUser(userId);
      if (customer?.subscriptionId && !ENDED_STATUSES.has(customer.subscriptionStatus ?? "")) {
        throw new AppError("Você já tem uma assinatura. Gerencie por ela.", 409);
      }
    }

    const customer = await ensureCustomer(client, userId);
    const back = `${webBase()}/channels/@me`;
    const common = {
      customer,
      client_reference_id: userId,
      line_items: [{ price, quantity: 1 }],
      locale: "pt-BR" as const,
      success_url: `${back}?billing=success`,
      cancel_url: `${back}?billing=canceled`,
    };

    const session =
      input.renewal === "automatic"
        ? await client.checkout.sessions.create({
            ...common,
            mode: "subscription",
            integration_identifier: CHECKOUT_FLOWS.subscription,
            metadata: { userId, kind: "subscription" },
            subscription_data: { metadata: { userId } },
          })
        : await client.checkout.sessions.create({
            ...common,
            mode: "payment",
            integration_identifier: CHECKOUT_FLOWS.pass,
            metadata: { userId, kind: "pass", days: String(PASS_DAYS[input.interval]), target: input.target },
            payment_intent_data: { metadata: { userId, kind: "pass", target: input.target } },
          });

    if (!session.url) throw new AppError("Não deu para abrir o pagamento", 502);
    return { url: session.url };
  },

  async portal(userId: string) {
    const client = requireStripe();
    const customer = await billingRepository.customerOfUser(userId);
    if (!customer) throw new AppError("Você ainda não tem pagamentos", 404);

    const session = await client.billingPortal.sessions.create({
      customer: customer.stripeCustomerId,
      return_url: `${webBase()}/channels/@me`,
    });

    return { url: session.url };
  },

  async refund(userId: string) {
    const payment = await billingRepository.latestPayment(userId);

    if (!payment || !refundable(payment) || !canRefund(payment)) {
      throw new AppError("Não há pagamento dentro dos 7 dias para reembolsar", 400);
    }

    const gift = await billingRepository.giftBySource(payment.sourceId);
    if (gift?.claimedAt) throw new AppError("Esse presente já foi resgatado e não dá para reembolsar", 409);

    const mpOrderId = mercadoPagoOrderOf(payment.sourceId);
    const mpPaymentId = mercadoPagoPaymentOf(payment.sourceId);
    if (mpOrderId || mpPaymentId) {
      if (mpOrderId) await refundOrder(mpOrderId);
      else await refundPayment(mpPaymentId!);
      await billingService.removeRecorded(payment);
      return billingService.status(userId);
    }

    const client = requireStripe();

    await client.refunds.create(
      { payment_intent: payment.paymentIntentId ?? undefined, metadata: { userId, reason: "withdrawal" } },
      { idempotencyKey: `refund-${payment.id}` },
    );

    if (payment.kind === "subscription") {
      const customer = await billingRepository.customerOfUser(userId);
      if (customer?.subscriptionId && !ENDED_STATUSES.has(customer.subscriptionStatus ?? "")) {
        await client.subscriptions.cancel(customer.subscriptionId);
      }
    }

    await billingService.removeRecorded(payment);
    return billingService.status(userId);
  },

  async removePayment(paymentIntentId: string) {
    const payment = await billingRepository.paymentByIntent(paymentIntentId);
    if (payment) await billingService.removeRecorded(payment);
  },

  async removeRecorded(payment: { id: string; userId: string; kind: string; days: number | null; sourceId: string }) {
    const { count } = await billingRepository.markRefunded(payment.id, new Date());
    if (!count) return;

    const { count: gifts } = await billingRepository.removeGift(payment.sourceId);
    if (gifts) return;

    await savePremium(payment.userId, (current) => afterPaymentRemoved(current, payment));
  },

  async grantPass(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId ?? session.client_reference_id;
    const target = session.metadata?.target === "gift" ? ("gift" as const) : ("me" as const);
    const days = Number(session.metadata?.days);
    if (!userId || !Number.isInteger(days) || days <= 0) return;

    if (await billingRepository.paymentBySource(session.id)) return;

    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    await billingService.recordPass({
      userId,
      sourceId: session.id,
      paymentIntentId: paymentIntentId ?? null,
      amount: session.amount_total ?? 0,
      currency: session.currency ?? "brl",
      days,
      interval: days >= 365 ? "year" : "month",
      target,
    });
  },

  async recordPass(pass: {
    userId: string;
    sourceId: string;
    paymentIntentId: string | null;
    amount: number;
    currency: string;
    days: number;
    interval: string;
    target: PurchaseTarget;
  }) {
    const { interval, target, ...payment } = pass;
    await billingRepository.createPayment({ ...payment, kind: "pass", paidAt: new Date() });

    if (target === "gift") {
      await giftService.create({
        buyerId: pass.userId,
        sourceId: pass.sourceId,
        interval,
        days: pass.days,
        amount: pass.amount,
      });
      return;
    }

    await savePremium(pass.userId, (current) => ({
      premiumUntil: extendPremium(current.premiumUntil, pass.days),
      premiumSource: current.premiumSource === "stripe_subscription" ? current.premiumSource : "stripe_pass",
    }));
  },

  async recordInvoice(client: Stripe, invoice: Stripe.Invoice) {
    const subscription = invoice.parent?.subscription_details?.subscription;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
    if (!subscription || !customerId || !invoice.id || invoice.amount_paid <= 0) return;

    const customer = await billingRepository.customerByStripeId(customerId);
    if (!customer || (await billingRepository.paymentBySource(invoice.id))) return;

    const payments = await client.invoicePayments
      .list({ invoice: invoice.id, status: "paid", limit: 1 })
      .catch((error: unknown) => {
        console.error("[stripe] não consegui ler o pagamento da fatura:", (error as Error).message);
        return null;
      });
    const intent = payments?.data[0]?.payment.payment_intent;

    await billingRepository.createPayment({
      userId: customer.userId,
      kind: "subscription",
      sourceId: invoice.id,
      paymentIntentId: typeof intent === "string" ? intent : (intent?.id ?? null),
      amount: invoice.amount_paid,
      currency: invoice.currency,
      days: null,
      paidAt: toDate(invoice.status_transitions.paid_at) ?? new Date(),
    });
  },

  async syncSubscription(client: Stripe, subscriptionId: string) {
    const subscription = await client.subscriptions.retrieve(subscriptionId);
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    const customer = await billingRepository.customerByStripeId(customerId);
    if (!customer) return;

    const periodEnd = periodEndOf(subscription);

    await billingRepository.updateCustomer(customerId, {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      interval: subscription.items.data[0]?.price.recurring?.interval ?? null,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    await savePremium(customer.userId, (current) =>
      afterSubscriptionChange(current, { status: subscription.status, periodEnd }),
    );
  },
};
