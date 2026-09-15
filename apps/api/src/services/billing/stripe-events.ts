import type { FastifyBaseLogger } from "fastify";

import type { Stripe } from "~/lib/stripe.js";
import { billingRepository } from "~/repositories/billing-repository.js";
import { billingService } from "./billing-service.js";

const idOf = (value: string | { id: string } | null | undefined) => (typeof value === "string" ? value : value?.id);

export async function handleStripeEvent(client: Stripe, event: Stripe.Event, log: FastifyBaseLogger) {
  if (await billingRepository.eventSeen(event.id)) return;

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.payment_status === "unpaid") break;

      if (session.mode === "payment") await billingService.grantPass(session);

      const subscription = idOf(session.subscription);
      if (session.mode === "subscription" && subscription) await billingService.syncSubscription(client, subscription);
      break;
    }

    case "checkout.session.async_payment_failed":
      log.info({ session: event.data.object.id }, "stripe: pagamento assíncrono falhou");
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await billingService.syncSubscription(client, event.data.object.id);
      break;

    case "invoice.paid": {
      const invoice = event.data.object;
      await billingService.recordInvoice(client, invoice);

      const subscription = idOf(invoice.parent?.subscription_details?.subscription);
      if (subscription) await billingService.syncSubscription(client, subscription);
      break;
    }

    case "invoice.payment_failed":
      log.warn({ invoice: event.data.object.id }, "stripe: renovação falhou");
      break;

    case "charge.refunded": {
      const intent = idOf(event.data.object.payment_intent);
      if (intent && event.data.object.refunded) await billingService.removePayment(intent);
      break;
    }

    case "charge.dispute.created": {
      const intent = idOf(event.data.object.payment_intent);
      if (intent) await billingService.removePayment(intent);
      break;
    }

    default:
      break;
  }

  await billingRepository.markEventSeen(event.id, event.type);
}
