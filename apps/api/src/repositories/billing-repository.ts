import type { Prisma } from "@prisma/client";

import { unset } from "~/lib/mongo.js";
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
    return prisma.billingPayment.updateMany({ where: { id, ...unset("refundedAt") }, data: { refundedAt } });
  },

  createPixCharge(data: Prisma.PixChargeCreateInput) {
    return prisma.pixCharge.create({ data });
  },

  updatePixCharge(id: string, data: Prisma.PixChargeUpdateInput) {
    return prisma.pixCharge.update({ where: { id }, data });
  },

  pixCharge(id: string) {
    return prisma.pixCharge.findUnique({ where: { id } });
  },

  pixChargeByPayment(mpPaymentId: string) {
    return prisma.pixCharge.findUnique({ where: { mpPaymentId } });
  },

  openPixCharge(userId: string, interval: string, now: Date) {
    return prisma.pixCharge.findFirst({
      where: { userId, interval, status: "pending", expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
  },

  pendingPixCharges(userId: string) {
    return prisma.pixCharge.findMany({ where: { userId, status: "pending" }, take: 5 });
  },

  claimPixCharge(id: string, paidAt: Date) {
    return prisma.pixCharge.updateMany({ where: { id, status: "pending" }, data: { status: "paid", paidAt } });
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
