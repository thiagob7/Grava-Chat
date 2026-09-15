import type { FastifyInstance } from "fastify";
import { checkoutInput } from "@gravae/shared";

import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";
import { stripe } from "~/lib/stripe.js";
import { billingEnabled, billingService } from "~/services/billing/billing-service.js";
import { handleStripeEvent } from "~/services/billing/stripe-events.js";

export async function billingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/billing", (req) => billingService.status(req.userId));

  app.post(
    "/billing/checkout",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    (req) => billingService.checkout(req.userId, checkoutInput.parse(req.body)),
  );

  app.post("/billing/portal", (req) => billingService.portal(req.userId));

  app.post(
    "/billing/refund",
    { config: { rateLimit: { max: 3, timeWindow: "10 minutes" } } },
    (req) => billingService.refund(req.userId),
  );
}

export async function billingWebhookRoutes(app: FastifyInstance) {
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => done(null, body));

  app.post("/billing/webhook", { config: { rateLimit: false } }, async (req, reply) => {
    if (!stripe || !billingEnabled()) throw new AppError("Não encontrado", 404);

    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) throw new AppError("Assinatura ausente", 400);

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new AppError("Assinatura inválida", 400);
    }

    await handleStripeEvent(stripe, event, req.log);
    return reply.code(200).send({ received: true });
  });
}
