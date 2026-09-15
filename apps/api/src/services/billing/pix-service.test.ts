import { beforeEach, describe, expect, it, vi } from "vitest";

const USER = "6a8781da7415b08f427be1a4";
type Charge = { id: string; userId: string; interval: string; days: number; amount: number; mpPaymentId: string | null; qrCode: string | null; qrCodeBase64: string | null; status: string; expiresAt: Date; paidAt: Date | null; createdAt: Date };

let charges: Charge[];
let mpStatus = "pending";
let mpAmount = 18;
const passes: { sourceId: string; days: number }[] = [];

vi.mock("~/lib/mercadopago.js", () => ({
  mercadoPagoEnabled: () => true,
  createPixPayment: async (args: { externalReference: string }) => ({
    id: `mp-${args.externalReference}`,
    status: "pending",
    amount: 18,
    externalReference: args.externalReference,
    qrCode: "00020126pix",
    qrCodeBase64: "base64",
  }),
  getPayment: async (id: string) => ({
    id,
    status: mpStatus,
    amount: mpAmount,
    externalReference: charges.find((c) => c.mpPaymentId === id)?.id ?? null,
  }),
}));

vi.mock("~/repositories/user-repository.js", () => ({
  userRepository: { findById: async () => ({ id: USER, email: "pessoa@exemplo.com" }) },
}));

vi.mock("./billing-service.js", () => ({
  billingService: { recordPass: async (pass: { sourceId: string; days: number }) => void passes.push(pass) },
}));

vi.mock("~/repositories/billing-repository.js", () => ({
  billingRepository: {
    createPixCharge: async (data: Omit<Charge, "id" | "status" | "mpPaymentId" | "qrCode" | "qrCodeBase64" | "paidAt" | "createdAt">) => {
      const row: Charge = { ...data, id: `c${charges.length + 1}`, status: "pending", mpPaymentId: null, qrCode: null, qrCodeBase64: null, paidAt: null, createdAt: new Date() };
      charges.push(row);
      return row;
    },
    updatePixCharge: async (id: string, data: Partial<Charge>) => Object.assign(charges.find((c) => c.id === id)!, data),
    pixCharge: async (id: string) => charges.find((c) => c.id === id) ?? null,
    pixChargeByPayment: async (id: string) => charges.find((c) => c.mpPaymentId === id) ?? null,
    openPixCharge: async (userId: string, interval: string, now: Date) =>
      charges.find((c) => c.userId === userId && c.interval === interval && c.status === "pending" && c.expiresAt > now) ?? null,
    pendingPixCharges: async () => charges.filter((c) => c.status === "pending"),
    claimPixCharge: async (id: string, paidAt: Date) => {
      const row = charges.find((c) => c.id === id && c.status === "pending");
      if (row) Object.assign(row, { status: "paid", paidAt });
      return { count: row ? 1 : 0 };
    },
  },
}));

const { pixService, paymentMatchesCharge } = await import("./pix-service.js");

beforeEach(() => {
  charges = [];
  passes.length = 0;
  mpStatus = "pending";
  mpAmount = 18;
});

describe("Pix avulso pelo Mercado Pago", () => {
  it("gera o QR do valor do período e reaproveita o Pix ainda aberto", async () => {
    const first = await pixService.create(USER, { interval: "month" });
    const again = await pixService.create(USER, { interval: "month" });

    expect(first).toMatchObject({ status: "pending", amount: 1800, qrCode: "00020126pix" });
    expect(again.id).toBe(first.id);
    expect(charges).toHaveLength(1);
  });

  it("pago confirma uma vez só, mesmo com aviso e consulta chegando juntos", async () => {
    const view = await pixService.create(USER, { interval: "month" });
    mpStatus = "approved";

    await Promise.all([pixService.handleNotification(`mp-${view.id}`), pixService.status(USER, view.id)]);
    await pixService.handleNotification(`mp-${view.id}`);

    expect(charges[0]!.status).toBe("paid");
    expect(passes).toEqual([expect.objectContaining({ sourceId: `mp:mp-${view.id}`, days: 30 })]);
  });

  it("valor diferente não libera nada", async () => {
    const view = await pixService.create(USER, { interval: "year" });
    mpStatus = "approved";
    mpAmount = 1;

    const status = await pixService.status(USER, view.id);

    expect(status.status).toBe("pending");
    expect(passes).toHaveLength(0);
  });

  it("vencido sem pagamento vira expirado", async () => {
    const view = await pixService.create(USER, { interval: "month" });
    charges[0]!.expiresAt = new Date(Date.now() - 1000);

    expect((await pixService.status(USER, view.id)).status).toBe("expired");
  });

  it("outra pessoa não consulta o Pix", async () => {
    const view = await pixService.create(USER, { interval: "month" });
    await expect(pixService.status("6a8781f57415b08f427be1ad", view.id)).rejects.toThrow(/não encontrado/);
  });

  it("confere referência e valor em centavos", () => {
    const charge = { id: "c1", amount: 18500 };
    expect(paymentMatchesCharge({ id: "1", status: "approved", amount: 185, externalReference: "c1" }, charge)).toBe(true);
    expect(paymentMatchesCharge({ id: "1", status: "approved", amount: 185, externalReference: "c2" }, charge)).toBe(false);
    expect(paymentMatchesCharge({ id: "1", status: "pending", amount: 185, externalReference: "c1" }, charge)).toBe(false);
  });
});
