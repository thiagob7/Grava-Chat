import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { webhookSignatureMatches } from "./mercadopago.js";

const SECRET = "segredo-de-teste";

const sign = (dataId: string, requestId: string, ts: string) =>
  createHmac("sha256", SECRET).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest("hex");

describe("assinatura do webhook do Mercado Pago", () => {
  it("aceita a assinatura feita com o segredo", () => {
    const v1 = sign("123456", "req-1", "1704908010");

    expect(
      webhookSignatureMatches({ signature: `ts=1704908010,v1=${v1}`, requestId: "req-1", dataId: "123456", secret: SECRET }),
    ).toBe(true);
  });

  it("recusa id trocado, pedido trocado ou cabeçalho estragado", () => {
    const v1 = sign("123456", "req-1", "1704908010");
    const base = { signature: `ts=1704908010,v1=${v1}`, requestId: "req-1", dataId: "123456", secret: SECRET };

    expect(webhookSignatureMatches({ ...base, dataId: "999" })).toBe(false);
    expect(webhookSignatureMatches({ ...base, requestId: "req-2" })).toBe(false);
    expect(webhookSignatureMatches({ ...base, signature: "v1=abc" })).toBe(false);
    expect(webhookSignatureMatches({ ...base, signature: undefined })).toBe(false);
  });
});
