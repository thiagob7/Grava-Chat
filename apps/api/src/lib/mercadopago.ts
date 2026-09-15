import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { env } from "~/env.js";

const MP_API = "https://api.mercadopago.com";
const TIMEOUT_MS = 10_000;

export interface MpPayment {
  id: string;
  status: string;
  amount: number | null;
  externalReference: string | null;
}

export interface MpPixCreated extends MpPayment {
  qrCode: string;
  qrCodeBase64: string;
}

const TOKEN_MARGIN_MS = 10 * 60 * 1000;

let cachedToken: { value: string; expiresAt: number } | null = null;

export const mercadoPagoEnabled = () =>
  Boolean(env.MERCADOPAGO_ACCESS_TOKEN || (env.MERCADOPAGO_CLIENT_ID && env.MERCADOPAGO_CLIENT_SECRET));

async function accessToken(): Promise<string> {
  if (env.MERCADOPAGO_ACCESS_TOKEN) return env.MERCADOPAGO_ACCESS_TOKEN;
  if (cachedToken && cachedToken.expiresAt - TOKEN_MARGIN_MS > Date.now()) return cachedToken.value;

  const reply = await fetch(`${MP_API}/oauth/token`, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: env.MERCADOPAGO_CLIENT_ID,
      client_secret: env.MERCADOPAGO_CLIENT_SECRET,
    }),
  });

  const json = (await reply.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
  if (!reply.ok || !json?.access_token) throw new Error(`Mercado Pago recusou as credenciais (${reply.status})`);

  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 21_600) * 1000 };
  return cachedToken.value;
}

async function call<T>(path: string, init: RequestInit & { idempotent?: boolean } = {}): Promise<T> {
  const reply = await fetch(`${MP_API}${path}`, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await accessToken()}`,
      ...(init.idempotent ? { "X-Idempotency-Key": randomUUID() } : {}),
    },
  });

  const json = (await reply.json().catch(() => null)) as Record<string, unknown> | null;
  if (!reply.ok) {
    const message = typeof json?.message === "string" ? json.message : `Mercado Pago respondeu ${reply.status}`;
    throw new Error(message);
  }

  return json as T;
}

const toPayment = (json: Record<string, unknown>): MpPayment => ({
  id: String(json.id ?? ""),
  status: typeof json.status === "string" ? json.status : "pending",
  amount: typeof json.transaction_amount === "number" ? json.transaction_amount : null,
  externalReference: typeof json.external_reference === "string" ? json.external_reference : null,
});

export async function createPixPayment(args: {
  amountCents: number;
  description: string;
  payerEmail: string;
  externalReference: string;
  expiresAt: Date;
}): Promise<MpPixCreated> {
  const json = await call<Record<string, unknown>>("/v1/payments", {
    method: "POST",
    idempotent: true,
    body: JSON.stringify({
      transaction_amount: args.amountCents / 100,
      description: args.description,
      payment_method_id: "pix",
      payer: { email: args.payerEmail },
      external_reference: args.externalReference,
      date_of_expiration: args.expiresAt.toISOString().replace("Z", "+00:00"),
      ...(env.MERCADOPAGO_NOTIFICATION_URL ? { notification_url: env.MERCADOPAGO_NOTIFICATION_URL } : {}),
    }),
  });

  const poi = (json.point_of_interaction ?? {}) as Record<string, unknown>;
  const tx = (poi.transaction_data ?? {}) as Record<string, unknown>;

  return {
    ...toPayment(json),
    qrCode: typeof tx.qr_code === "string" ? tx.qr_code : "",
    qrCodeBase64: typeof tx.qr_code_base64 === "string" ? tx.qr_code_base64 : "",
  };
}

export async function getPayment(paymentId: string): Promise<MpPayment> {
  return toPayment(await call<Record<string, unknown>>(`/v1/payments/${encodeURIComponent(paymentId)}`));
}

export async function refundPayment(paymentId: string) {
  await call(`/v1/payments/${encodeURIComponent(paymentId)}/refunds`, { method: "POST", idempotent: true, body: "{}" });
}

export function webhookSignatureMatches(input: {
  signature: string | string[] | undefined;
  requestId: string | string[] | undefined;
  dataId: string;
  secret: string;
}): boolean {
  const signature = Array.isArray(input.signature) ? input.signature[0] : input.signature;
  const requestId = Array.isArray(input.requestId) ? input.requestId[0] : input.requestId;
  if (!signature || !input.secret) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((piece) => {
      const [key, ...rest] = piece.split("=");
      return [key?.trim() ?? "", rest.join("=").trim()];
    }),
  );
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${input.dataId.toLowerCase()};request-id:${requestId ?? ""};ts:${parts.ts};`;
  const expected = Buffer.from(createHmac("sha256", input.secret).update(manifest).digest("hex"));
  const received = Buffer.from(parts.v1);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
