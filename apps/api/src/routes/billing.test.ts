import Fastify from "fastify";
import { createHmac } from "node:crypto";
import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

const SECRET = "whsec_teste_de_assinatura";
const handled: string[] = [];

const MP_SECRET = "segredo-mp";
const notified: string[] = [];

vi.mock("~/env.js", () => ({
  env: { STRIPE_WEBHOOK_SECRET: SECRET, MERCADOPAGO_WEBHOOK_SECRET: MP_SECRET, ADMIN_EMAILS: "", WEB_ORIGIN: "http://localhost:5173" },
}));
vi.mock("~/services/billing/gift-service.js", () => ({ giftService: {} }));
vi.mock("~/services/billing/card-check.js", () => ({ cardCheckService: {} }));
vi.mock("~/services/billing/pix-service.js", () => ({
  pixService: { handleNotification: async (id: string) => void notified.push(id) },
}));
vi.mock("~/lib/stripe.js", () => ({ stripe: new Stripe("sk_test_falsa") }));
vi.mock("~/services/billing/billing-service.js", () => ({ billingEnabled: () => true, billingService: {} }));
vi.mock("~/services/billing/stripe-events.js", () => ({
  handleStripeEvent: async (_client: unknown, event: { id: string }) => void handled.push(event.id),
}));

const { billingWebhookRoutes, mercadoPagoWebhookRoutes } = await import("./billing.js");

async function build() {
  const app = Fastify();
  await app.register(async (api) => api.register(billingWebhookRoutes), { prefix: "/api" });
  await app.register(async (api) => api.register(mercadoPagoWebhookRoutes), { prefix: "/api" });
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

describe("webhook do Mercado Pago", () => {
  const url = "/api/billing/mercadopago/webhook?data.id=123456&type=payment";
  const signed = (dataId: string) => {
    const v1 = createHmac("sha256", MP_SECRET).update(`id:${dataId};request-id:req-9;ts:1700000000;`).digest("hex");
    return { "x-signature": `ts=1700000000,v1=${v1}`, "x-request-id": "req-9" };
  };

  it("com assinatura certa, confere o pagamento", async () => {
    const app = await build();
    const reply = await app.inject({ method: "POST", url, headers: signed("123456"), payload: { type: "payment", data: { id: "123456" } } });

    expect(reply.statusCode).toBe(200);
    expect(notified).toContain("123456");
  });

  it("sem assinatura ou com assinatura de outro pagamento, recusa", async () => {
    const app = await build();
    notified.length = 0;

    const none = await app.inject({ method: "POST", url, payload: { type: "payment", data: { id: "123456" } } });
    const other = await app.inject({ method: "POST", url, headers: signed("999"), payload: {} });

    expect(none.statusCode).toBe(401);
    expect(other.statusCode).toBe(401);
    expect(notified).toHaveLength(0);
  });
});
