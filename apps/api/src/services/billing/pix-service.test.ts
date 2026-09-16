import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "6a8781da7415b08f427be1a4";
type Charge = { id: string; userId: string; interval: string; target: string; days: number; amount: number; mpPaymentId: string | null; mpOrderId: string | null; qrCode: string | null; qrCodeBase64: string | null; status: string; expiresAt: Date; paidAt: Date | null; createdAt: Date };

let charges: Charge[];
let mpStatus = "created";
let mpAmount = 18;
const passes: { sourceId: string; days: number }[] = [];

vi.mock("~/lib/mercadopago.js", () => ({
  mercadoPagoEnabled: () => true,
  createPixOrder: async (args: { externalReference: string; amountCents: number }) => ({
    id: `ord-${args.externalReference}`,
    status: "created",
    amountCents: args.amountCents,
    externalReference: args.externalReference,
    qrData: "00020126pix",
  }),
  getOrder: async (id: string) => {
    const charge = charges.find((c) => c.mpOrderId === id);
    return { id, status: mpStatus, amountCents: mpAmount * 100, externalReference: charge?.id ?? null, qrData: null };
  },
  getPayment: async () => null,
}));

vi.mock("./billing-service.js", () => ({
  billingService: { recordPass: async (pass: { sourceId: string; days: number }) => void passes.push(pass) },
}));

vi.mock("~/repositories/billing-repository.js", () => ({
  billingRepository: {
    createPixCharge: async (data: Omit<Charge, "id" | "status" | "mpPaymentId" | "qrCode" | "qrCodeBase64" | "paidAt" | "createdAt">) => {
      const row: Charge = { ...data, id: `c${charges.length + 1}`, status: "pending", target: "me", mpPaymentId: null, mpOrderId: null, qrCode: null, qrCodeBase64: null, paidAt: null, createdAt: new Date() };
      charges.push(row);
      return row;
    },
    updatePixCharge: async (id: string, data: Partial<Charge>) => Object.assign(charges.find((c) => c.id === id)!, data),
    pixCharge: async (id: string) => charges.find((c) => c.id === id) ?? null,
    pixChargeByPayment: async (id: string) => charges.find((c) => c.mpPaymentId === id) ?? null,
    pixChargeByOrder: async (id: string) => charges.find((c) => c.mpOrderId === id) ?? null,
    openPixCharge: async (userId: string, interval: string, _target: string, now: Date) =>
      charges.find((c) => c.userId === userId && c.interval === interval && c.status === "pending" && c.expiresAt > now) ?? null,
    pendingPixCharges: async () => charges.filter((c) => c.status === "pending"),
    claimPixCharge: async (id: string, paidAt: Date) => {
      const row = charges.find((c) => c.id === id && c.status === "pending");
      if (row) Object.assign(row, { status: "paid", paidAt });
      return { count: row ? 1 : 0 };
    },
  },
}));

const { pixService, paymentMatchesCharge, orderMatchesCharge } = await import("./pix-service.js");

beforeEach(() => {
  charges = [];
  passes.length = 0;
  mpStatus = "pending";
  mpAmount = 18;
});

describe("Pix avulso pelo Mercado Pago", () => {
  it("gera o QR do valor do período e reaproveita o Pix ainda aberto", async () => {
    const first = await pixService.create(USER, { interval: "month", target: "me" });
    const again = await pixService.create(USER, { interval: "month", target: "me" });

    expect(first).toMatchObject({ status: "pending", amount: 1800, qrCode: "00020126pix" });
    expect(again.id).toBe(first.id);
    expect(charges).toHaveLength(1);
  });

  it("pago confirma uma vez só, mesmo com aviso e consulta chegando juntos", async () => {
    const view = await pixService.create(USER, { interval: "month", target: "me" });
    mpStatus = "processed";

    await Promise.all([pixService.handleNotification(`ord-${view.id}`), pixService.status(USER, view.id)]);
    await pixService.handleNotification(`ord-${view.id}`);

    expect(charges[0]!.status).toBe("paid");
    expect(passes).toEqual([expect.objectContaining({ sourceId: `mpo:ord-${view.id}`, days: 30 })]);
  });

  it("valor diferente não libera nada", async () => {
    const view = await pixService.create(USER, { interval: "year", target: "me" });
    mpStatus = "processed";
    mpAmount = 1;

    const status = await pixService.status(USER, view.id);

    expect(status.status).toBe("pending");
    expect(passes).toHaveLength(0);
  });

  it("vencido sem pagamento vira expirado", async () => {
    const view = await pixService.create(USER, { interval: "month", target: "me" });
    charges[0]!.expiresAt = new Date(Date.now() - 1000);

    expect((await pixService.status(USER, view.id)).status).toBe("expired");
  });

  it("outra pessoa não consulta o Pix", async () => {
    const view = await pixService.create(USER, { interval: "month", target: "me" });
    await expect(pixService.status("6a8781f57415b08f427be1ad", view.id)).rejects.toThrow(/não encontrado/);
  });

  it("ordem só vale processada, da cobrança e com o valor certo", () => {
    const charge = { id: "c1", amount: 1800 };
    expect(orderMatchesCharge({ id: "o", status: "processed", amountCents: 1800, externalReference: "c1", qrData: null }, charge)).toBe(true);
    expect(orderMatchesCharge({ id: "o", status: "created", amountCents: 1800, externalReference: "c1", qrData: null }, charge)).toBe(false);
    expect(orderMatchesCharge({ id: "o", status: "processed", amountCents: 1700, externalReference: "c1", qrData: null }, charge)).toBe(false);
  });

  it("confere referência e valor em centavos", () => {
    const charge = { id: "c1", amount: 18500 };
    expect(paymentMatchesCharge({ id: "1", status: "approved", amount: 185, externalReference: "c1" }, charge)).toBe(true);
    expect(paymentMatchesCharge({ id: "1", status: "approved", amount: 185, externalReference: "c2" }, charge)).toBe(false);
    expect(paymentMatchesCharge({ id: "1", status: "pending", amount: 185, externalReference: "c1" }, charge)).toBe(false);
  });
});
