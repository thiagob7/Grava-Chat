import Redis from "ioredis";
import { env } from "~/env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  commandTimeout: 5_000,
  retryStrategy: (attempts) => Math.min(attempts * 200, 3_000),
});

export function watch(client: Redis, name: string) {
  client.on("error", (error) => console.error(`[redis:${name}]`, error.message));
  return client;
}

watch(redis, "principal");

export const keys = {
  voicePeople: "voice:pessoas",
  adminSession: (tokenHash: string) => `admin:sessao:${tokenHash}`,
  adminAttempts: (userId: string) => `admin:tentativas:${userId}`,
  legacyPresence: (userId: string) => `presence:${userId}`,
  voiceState: (userId: string) => `voice:user:${userId}`,
  voiceChannel: (channelId: string) => `voice:channel:${channelId}`,
  voiceSlots: (userId: string) => `voice:slots:${userId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  accessValidAfter: (userId: string) => `auth:valido-apos:${userId}`,
  loginFailures: (emailHash: string) => `auth:falhas:${emailHash}`,
  idle: (userId: string) => `idle:${userId}`,
  webhookRate: (webhookId: string) => `webhook:rate:${webhookId}`,
  interaction: (interactionId: string) => `interaction:${interactionId}`,
  interactionAnswered: (interactionId: string) => `interaction:answered:${interactionId}`,
  ephemeralMessage: (messageId: string) => `ephemeral:${messageId}`,
  modal: (modalId: string) => `modal:${modalId}`,
  slowmode: (channelId: string, userId: string) => `slow:${channelId}:${userId}`,
  uploadQuota: (userId: string) => `upload:bytes:${userId}`,
  messagesFlow: (userId: string) => `fluxo:msg:${userId}`,
  sendReceipt: (userId: string, nonce: string) => `envio:recibo:${userId}:${nonce}`,
  desktopLogin: (code: string) => `desktop-login:${code}`,
  oauthCode: (code: string) => `oauth:code:${code}`,
  oauthToken: (token: string) => `oauth:token:${token}`,
  personOauth: (userId: string) => `oauth:usuario:${userId}`,
  passwordReset: (token: string) => `senha:redefinir:${token}`,
  resetRequest: (userId: string) => `senha:pedido:${userId}`,
  emailVerification: (token: string) => `email:verificar:${token}`,
  officialNotice: (key: string) => `oficial:aviso:${key}`,
  verificationRequest: (userId: string) => `email:pedido:${userId}`,
} as const;
