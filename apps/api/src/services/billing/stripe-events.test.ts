import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "6a8781da7415b08f427be1a4";
const DAY = 24 * 60 * 60 * 1000;

type Payment = { id: string; userId: string; kind: string; sourceId: string; paymentIntentId: string | null; days: number | null; paidAt: Date; refundedAt: Date | null; amount: number; currency: string };

let user: { id: string; premiumUntil: Date | null; premiumSource: string | null };
let payments: Payment[];
let seen: Set<string>;
let customer: Record<string, unknown> | null;
const announced: string[] = [];

vi.mock("~/env.js", () => ({ env: { WEB_ORIGIN: "http://localhost:5173", STRIPE_PRICE_MONTHLY: "", STRIPE_PRICE_YEARLY: "", STRIPE_PRICE_MONTH_PASS: "", STRIPE_PRICE_YEAR_PASS: "", STRIPE_WEBHOOK_SECRET: "" } }));
vi.mock("~/lib/stripe.js", () => ({ stripe: null }));
vi.mock("~/realtime/difusao.js", () => ({ announceUserUpdated: async (u: { id: string }) => void announced.push(u.id) }));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: {
    findById: async () => user,
    update: async (_id: string, data: Partial<typeof user>) => (user = { ...user, ...data }),
  },
}));

vi.mock("~/repositories/billing-repository.js", () => ({
  billingRepository: {
    eventSeen: async (id: string) => seen.has(id),
    markEventSeen: async (id: string) => void seen.add(id),
    paymentBySource: async (sourceId: string) => payments.find((p) => p.sourceId === sourceId) ?? null,
    paymentByIntent: async (intent: string) => payments.find((p) => p.paymentIntentId === intent) ?? null,
    createPayment: async (data: Omit<Payment, "id" | "refundedAt">) => {
      const row = { ...data, id: `p${payments.length + 1}`, refundedAt: null };
      payments.push(row);
      return row;
    },
    markRefunded: async (id: string, at: Date) => {
      const row = payments.find((p) => p.id === id && !p.refundedAt);
      if (row) row.refundedAt = at;
      return { count: row ? 1 : 0 };
    },
    removeGift: async () => ({ count: 0 }),
    giftBySource: async () => null,
    customerByStripeId: async () => customer,
    updateCustomer: async (_id: string, data: Record<string, unknown>) => (customer = { ...customer, ...data }),
  },
}));

const { handleStripeEvent } = await import("./stripe-events.js");

const log = { info: () => undefined, warn: () => undefined } as never;

const passSession = (paymentStatus: "paid" | "unpaid") => ({
  id: "cs_1",
  mode: "payment",
  payment_status: paymentStatus,
  client_reference_id: USER,
  metadata: { userId: USER, kind: "pass", days: "30" },
  payment_intent: "pi_1",
  amount_total: 1890,
  currency: "brl",
  subscription: null,
});

const event = (id: string, type: string, object: unknown) => ({ id, type, data: { object } }) as never;

beforeEach(() => {
  user = { id: USER, premiumUntil: null, premiumSource: null };
  payments = [];
  seen = new Set();
  customer = null;
  announced.length = 0;
});

describe("eventos da Stripe", () => {
  it("Pix ainda não pago no fim do checkout não libera nada", async () => {
    await handleStripeEvent({} as never, event("evt_1", "checkout.session.completed", passSession("unpaid")), log);

    expect(user.premiumUntil).toBeNull();
    expect(payments).toHaveLength(0);
  });

  it("Pix confirmado depois libera os dias e avisa a conta", async () => {
    await handleStripeEvent({} as never, event("evt_1", "checkout.session.completed", passSession("unpaid")), log);
    await handleStripeEvent({} as never, event("evt_2", "checkout.session.async_payment_succeeded", passSession("paid")), log);

    expect(user.premiumSource).toBe("stripe_pass");
    expect(user.premiumUntil!.getTime()).toBeGreaterThan(Date.now() + 29 * DAY);
    expect(announced).toEqual([USER]);
  });

  it("o mesmo pagamento chegando de novo não soma dias duas vezes", async () => {
    await handleStripeEvent({} as never, event("evt_1", "checkout.session.completed", passSession("paid")), log);
    const first = user.premiumUntil!.getTime();

    await handleStripeEvent({} as never, event("evt_1", "checkout.session.completed", passSession("paid")), log);
    await handleStripeEvent({} as never, event("evt_9", "checkout.session.async_payment_succeeded", passSession("paid")), log);

    expect(user.premiumUntil!.getTime()).toBe(first);
    expect(payments).toHaveLength(1);
  });

  it("reembolso feito no painel da Stripe tira os dias daquele pagamento", async () => {
    await handleStripeEvent({} as never, event("evt_1", "checkout.session.completed", passSession("paid")), log);
    await handleStripeEvent({} as never, event("evt_2", "charge.refunded", { payment_intent: "pi_1", refunded: true }), log);

    expect(user.premiumUntil!.getTime()).toBeLessThanOrEqual(Date.now());
    expect(payments[0]!.refundedAt).not.toBeNull();
  });

  it("assinatura ativa sincroniza a data com o fim do período", async () => {
    const periodEnd = Math.floor((Date.now() + 30 * DAY) / 1000);
    customer = { userId: USER, stripeCustomerId: "cus_1" };

    const client = {
      subscriptions: {
        retrieve: async () => ({
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          cancel_at_period_end: false,
          items: { data: [{ current_period_end: periodEnd, price: { recurring: { interval: "month" } } }] },
        }),
      },
    };

    await handleStripeEvent(client as never, event("evt_1", "customer.subscription.updated", { id: "sub_1" }), log);

    expect(user.premiumSource).toBe("stripe_subscription");
    expect(user.premiumUntil!.getTime()).toBe(periodEnd * 1000);
    expect(customer).toMatchObject({ subscriptionStatus: "active", interval: "month" });
  });
});
