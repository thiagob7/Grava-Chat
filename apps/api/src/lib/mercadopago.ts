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

const TOKEN_MARGIN_MS = 10 * 60 * 1000;

let cachedToken: { value: string; userId: string; expiresAt: number } | null = null;
let fixedUserId: string | null = null;
let posReady: string | null = null;

export const POS_EXTERNAL_ID = () => env.MERCADOPAGO_POS_EXTERNAL_ID || "GRAVAEINFINITY";

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

  const json = (await reply.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; user_id?: string | number }
    | null;
  if (!reply.ok || !json?.access_token) throw new Error(`Mercado Pago recusou as credenciais (${reply.status})`);

  cachedToken = {
    value: json.access_token,
    userId: String(json.user_id ?? ""),
    expiresAt: Date.now() + (json.expires_in ?? 21_600) * 1000,
  };
  return cachedToken.value;
}

async function accountUserId(): Promise<string> {
  await accessToken();
  if (cachedToken?.userId) return cachedToken.userId;
  if (fixedUserId) return fixedUserId;

  const me = await call<{ id?: string | number }>("/users/me");
  fixedUserId = String(me.id ?? "");
  return fixedUserId;
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

export interface MpOrder {
  id: string;
  status: string;
  externalReference: string | null;
  amountCents: number | null;
  qrData: string | null;
}

type OrderResponse = {
  id?: string;
  status?: string;
  external_reference?: string;
  total_amount?: string | number;
  transactions?: { payments?: { amount?: string | number; status?: string }[] };
  type_response?: { qr_data?: string };
};

const toOrder = (order: OrderResponse): MpOrder => {
  const amount = order.transactions?.payments?.[0]?.amount ?? order.total_amount;
  return {
    id: String(order.id ?? ""),
    status: order.status ?? "created",
    externalReference: order.external_reference ?? null,
    amountCents: amount === undefined ? null : Math.round(Number(amount) * 100),
    qrData: order.type_response?.qr_data ?? null,
  };
};

export async function ensurePointOfSale(): Promise<string> {
  const externalId = POS_EXTERNAL_ID();
  if (posReady === externalId) return externalId;

  const found = await call<{ results?: { external_id?: string; status?: string }[] }>(
    `/pos?limit=50&offset=0&external_id=${encodeURIComponent(externalId)}`,
  );
  if (found.results?.some((pos) => pos.external_id === externalId && (!pos.status || pos.status.toLowerCase() === "active"))) {
    posReady = externalId;
    return externalId;
  }

  const userId = await accountUserId();
  const search = await call<{ results?: { id: string | number; external_id?: string }[] } | { results?: { id: string | number; external_id?: string }[] }[]>(
    `/users/${userId}/stores/search?limit=50&offset=0`,
  );
  const stores = (Array.isArray(search) ? search : [search]).flatMap((page) => page.results ?? []);
  const store = stores.find((candidate) => String(candidate.id) === env.MERCADOPAGO_STORE_ID) ?? stores.find((candidate) => candidate.external_id);
  if (!store?.external_id) throw new Error("A conta Mercado Pago precisa de uma loja física cadastrada para o QR do Pix");

  await call("/pos", {
    method: "POST",
    body: JSON.stringify({
      name: "Infinity",
      fixed_amount: true,
      store_id: Number(store.id),
      external_store_id: store.external_id,
      external_id: externalId,
    }),
  });

  posReady = externalId;
  return externalId;
}

export async function createPixOrder(args: {
  amountCents: number;
  description: string;
  externalReference: string;
  expiresMinutes: number;
}): Promise<MpOrder> {
  const externalPosId = await ensurePointOfSale();
  const amount = (args.amountCents / 100).toFixed(2);

  return toOrder(
    await call<OrderResponse>("/v1/orders", {
      method: "POST",
      idempotent: true,
      body: JSON.stringify({
        type: "qr",
        total_amount: amount,
        external_reference: args.externalReference,
        expiration_time: `PT${args.expiresMinutes}M`,
        transactions: { payments: [{ amount }] },
        config: { qr: { external_pos_id: externalPosId, mode: "dynamic" } },
        description: args.description.slice(0, 150),
      }),
    }),
  );
}

export async function getOrder(orderId: string): Promise<MpOrder> {
  return toOrder(await call<OrderResponse>(`/v1/orders/${encodeURIComponent(orderId)}`));
}

export async function refundOrder(orderId: string) {
  await call(`/v1/orders/${encodeURIComponent(orderId)}/refund`, { method: "POST", idempotent: true });
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
