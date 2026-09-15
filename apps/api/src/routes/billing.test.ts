import Fastify from "fastify";
import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

const SECRET = "whsec_teste_de_assinatura";
const handled: string[] = [];

vi.mock("~/env.js", () => ({ env: { STRIPE_WEBHOOK_SECRET: SECRET } }));
vi.mock("~/lib/stripe.js", () => ({ stripe: new Stripe("sk_test_falsa") }));
vi.mock("~/services/billing/billing-service.js", () => ({ billingEnabled: () => true, billingService: {} }));
vi.mock("~/services/billing/stripe-events.js", () => ({
  handleStripeEvent: async (_client: unknown, event: { id: string }) => void handled.push(event.id),
}));

const { billingWebhookRoutes } = await import("./billing.js");

async function build() {
  const app = Fastify();
  await app.register(async (api) => api.register(billingWebhookRoutes), { prefix: "/api" });
  app.post("/api/outra", async (req) => ({ body: req.body }));
  return app;
}

const payload = JSON.stringify({ id: "evt_teste", object: "event", type: "invoice.paid", data: { object: {} } });

describe("webhook da Stripe", () => {
  it("aceita o evento com assinatura válida sobre o corpo cru", async () => {
    const app = await build();
    const header = new Stripe("sk_test_falsa").webhooks.generateTestHeaderString({ payload, secret: SECRET });

    const reply = await app.inject({
      method: "POST",
      url: "/api/billing/webhook",
      headers: { "content-type": "application/json", "stripe-signature": header },
      payload,
    });

    expect(reply.statusCode).toBe(200);
    expect(handled).toContain("evt_teste");
  });

  it("recusa assinatura errada ou ausente", async () => {
    const app = await build();

    const wrong = await app.inject({
      method: "POST",
      url: "/api/billing/webhook",
      headers: { "content-type": "application/json", "stripe-signature": "t=1,v1=errada" },
      payload,
    });
    const missing = await app.inject({
      method: "POST",
      url: "/api/billing/webhook",
      headers: { "content-type": "application/json" },
      payload,
    });

    expect(wrong.statusCode).toBe(400);
    expect(missing.statusCode).toBe(400);
  });

  it("o corpo cru fica só na rota da Stripe, as outras continuam lendo JSON", async () => {
    const app = await build();
    const reply = await app.inject({ method: "POST", url: "/api/outra", payload: { a: 1 } });

    expect(reply.json()).toEqual({ body: { a: 1 } });
  });
});
