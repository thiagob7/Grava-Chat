import type { Prisma } from "@prisma/client";

import { prisma } from "~/lib/prisma.js";

export const billingRepository = {
  customerOfUser(userId: string) {
    return prisma.billingCustomer.findUnique({ where: { userId } });
  },

  customerByStripeId(stripeCustomerId: string) {
    return prisma.billingCustomer.findUnique({ where: { stripeCustomerId } });
  },

  createCustomer(userId: string, stripeCustomerId: string) {
    return prisma.billingCustomer.create({ data: { userId, stripeCustomerId } });
  },

  updateCustomer(stripeCustomerId: string, data: Prisma.BillingCustomerUpdateInput) {
    return prisma.billingCustomer.update({ where: { stripeCustomerId }, data });
  },

  paymentBySource(sourceId: string) {
    return prisma.billingPayment.findUnique({ where: { sourceId } });
  },

  paymentByIntent(paymentIntentId: string) {
    return prisma.billingPayment.findFirst({ where: { paymentIntentId } });
  },

  latestPayment(userId: string) {
    return prisma.billingPayment.findFirst({ where: { userId }, orderBy: { paidAt: "desc" } });
  },

  createPayment(data: Prisma.BillingPaymentCreateInput) {
    return prisma.billingPayment.create({ data });
  },

  markRefunded(id: string, refundedAt: Date) {
    return prisma.billingPayment.updateMany({ where: { id, refundedAt: null }, data: { refundedAt } });
  },

  async eventSeen(stripeId: string) {
    return (await prisma.billingEvent.count({ where: { stripeId } })) > 0;
  },

  async markEventSeen(stripeId: string, type: string) {
    await prisma.billingEvent.create({ data: { stripeId, type } }).catch((error: { code?: string }) => {
      if (error.code !== "P2002") throw error;
    });
  },
};
