import { PASS_DAYS, PASS_PRICE_CENTS, PLAN_NAME, type PixChargeInput, type PixChargeView } from "@gravae/shared";

import { AppError, NotFoundError } from "~/lib/http.js";
import { createPixPayment, getPayment, mercadoPagoEnabled, type MpPayment } from "~/lib/mercadopago.js";
import { billingRepository } from "~/repositories/billing-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { billingService } from "./billing-service.js";

export const PIX_CHARGE_MINUTES = 30;

type ChargeRow = NonNullable<Awaited<ReturnType<typeof billingRepository.pixCharge>>>;

const toView = (charge: ChargeRow): PixChargeView => ({
  id: charge.id,
  status: charge.status as PixChargeView["status"],
  interval: charge.interval as PixChargeView["interval"],
  amount: charge.amount,
  qrCode: charge.qrCode,
  qrCodeBase64: charge.qrCodeBase64,
  expiresAt: charge.expiresAt.toISOString(),
});

export const paymentMatchesCharge = (payment: MpPayment, charge: { id: string; amount: number }) =>
  payment.status === "approved" &&
  payment.externalReference === charge.id &&
  payment.amount !== null &&
  Math.round(payment.amount * 100) === charge.amount;

export const pixService = {
  async create(userId: string, input: PixChargeInput): Promise<PixChargeView> {
    if (!mercadoPagoEnabled()) throw new AppError("O Pix ainda não está disponível", 503);

    const now = new Date();
    const open = await billingRepository.openPixCharge(userId, input.interval, now);
    if (open?.qrCode) return toView(open);

    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("Conta não encontrada");

    const amount = PASS_PRICE_CENTS[input.interval];
    const days = PASS_DAYS[input.interval];
    const expiresAt = new Date(now.getTime() + PIX_CHARGE_MINUTES * 60_000);

    const charge = await billingRepository.createPixCharge({ userId, interval: input.interval, days, amount, expiresAt });

    try {
      const created = await createPixPayment({
        amountCents: amount,
        description: `${PLAN_NAME} · ${days} dias`,
        payerEmail: user.email,
        externalReference: charge.id,
        expiresAt,
      });

      return toView(
        await billingRepository.updatePixCharge(charge.id, {
          mpPaymentId: created.id,
          qrCode: created.qrCode,
          qrCodeBase64: created.qrCodeBase64,
        }),
      );
    } catch (error) {
      await billingRepository.updatePixCharge(charge.id, { status: "expired" });
      throw new AppError(`Não deu para gerar o Pix: ${(error as Error).message}`, 502);
    }
  },

  async status(userId: string, chargeId: string): Promise<PixChargeView> {
    const charge = await billingRepository.pixCharge(chargeId);
    if (!charge || charge.userId !== userId) throw new NotFoundError("Pix não encontrado");

    return toView(await pixService.refresh(charge));
  },

  async refresh(charge: ChargeRow): Promise<ChargeRow> {
    if (charge.status !== "pending" || !charge.mpPaymentId) return charge;

    const payment = await getPayment(charge.mpPaymentId).catch(() => null);
    if (payment && paymentMatchesCharge(payment, charge)) {
      await pixService.confirm(charge, payment.id);
      return (await billingRepository.pixCharge(charge.id)) ?? charge;
    }

    if (charge.expiresAt <= new Date()) {
      return billingRepository.updatePixCharge(charge.id, { status: "expired" });
    }

    return charge;
  },

  async confirm(charge: ChargeRow, mpPaymentId: string) {
    const { count } = await billingRepository.claimPixCharge(charge.id, new Date());
    if (!count) return;

    await billingService.recordPass({
      userId: charge.userId,
      sourceId: `mp:${mpPaymentId}`,
      paymentIntentId: null,
      amount: charge.amount,
      currency: "brl",
      days: charge.days,
    });
  },

  async handleNotification(mpPaymentId: string) {
    const charge = await billingRepository.pixChargeByPayment(mpPaymentId);
    if (charge) await pixService.refresh(charge);
  },

  async refreshPendingOf(userId: string) {
    if (!mercadoPagoEnabled()) return;

    const pending = await billingRepository.pendingPixCharges(userId);
    await Promise.all(pending.map((charge) => pixService.refresh(charge).catch(() => charge)));
  },
};
