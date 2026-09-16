import type { FastifyInstance } from "fastify";
import { checkoutInput, cleanGiftCode, giftClaimInput, objectId, pixChargeInput } from "@gravae/shared";
import { z } from "zod";

import { env } from "~/env.js";
import { AppError } from "~/lib/http.js";
import { stripe } from "~/lib/stripe.js";
import { billingEnabled, billingService } from "~/services/billing/billing-service.js";
import { handleStripeEvent } from "~/services/billing/stripe-events.js";
import { pixService } from "~/services/billing/pix-service.js";
import { giftService } from "~/services/billing/gift-service.js";
import { cardCheckService } from "~/services/billing/card-check.js";
import { webhookSignatureMatches } from "~/lib/mercadopago.js";

export async function billingRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/billing", async (req) => {
    await pixService.refreshPendingOf(req.userId);
    return billingService.status(req.userId);
  });

  app.post(
    "/billing/pix",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    (req) => pixService.create(req.userId, pixChargeInput.parse(req.body)),
  );

  app.get("/billing/pix/:chargeId", (req) => {
    const { chargeId } = z.object({ chargeId: objectId }).parse(req.params);
    return pixService.status(req.userId, chargeId);
  });

  app.post(
    "/billing/checkout",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    (req) => billingService.checkout(req.userId, checkoutInput.parse(req.body)),
  );

  app.post(
    "/billing/card",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    (req) => billingService.cardIntent(req.userId, checkoutInput.parse(req.body)),
  );

  app.post("/billing/portal", (req) => billingService.portal(req.userId));

  app.get("/billing/gifts", (req) => giftService.mine(req.userId));

  app.get("/billing/gifts/:code", (req) => {
    const { code } = z.object({ code: z.string().min(1).max(32) }).parse(req.params);
    return giftService.preview(req.userId, cleanGiftCode(code));
  });

  app.post(
    "/billing/gifts/claim",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    (req) => {
      const input = giftClaimInput.parse(req.body);
      return giftService.claim(req.userId, cleanGiftCode(input.code), input.setupIntentId);
    },
  );

  app.post(
    "/billing/card-check",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    (req) => cardCheckService.start(req.userId),
  );

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

export async function mercadoPagoWebhookRoutes(app: FastifyInstance) {
  app.post("/billing/mercadopago/webhook", { config: { rateLimit: false } }, async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const body = (req.body ?? {}) as { type?: string; data?: { id?: string | number } };

    const type = query.type ?? query.topic ?? body.type ?? "";
    const paymentId = query["data.id"] ?? query.id ?? (body.data?.id != null ? String(body.data.id) : "");
    const relevant = !type || /payment|order/i.test(type);
    if (!paymentId || !relevant) return reply.code(200).send({ ok: true });

    const valid =
      !env.MERCADOPAGO_WEBHOOK_SECRET ||
      webhookSignatureMatches({
        signature: req.headers["x-signature"],
        requestId: req.headers["x-request-id"],
        dataId: paymentId,
        secret: env.MERCADOPAGO_WEBHOOK_SECRET,
      });
    if (!valid) return reply.code(401).send({ ok: false });

    await pixService.handleNotification(paymentId);
    return reply.code(200).send({ ok: true });
  });
}

export async function publicGiftRoutes(app: FastifyInstance) {
  app.get(
    "/gifts/:code",
    { config: { rateLimit: { max: 30, timeWindow: "5 minutes" } } },
    (req) => {
      const { code } = z.object({ code: z.string().min(1).max(32) }).parse(req.params);
      return giftService.publicView(cleanGiftCode(code));
    },
  );
}
