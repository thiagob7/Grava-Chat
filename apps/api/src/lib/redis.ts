import Redis from "ioredis";
import { env } from "~/env.js";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export function watch(client: Redis, name: string) {
  client.on("error", (error) => console.error(`[redis:${name}]`, error.message));
  return client;
}

watch(redis, "principal");

export const keys = {
  voiceState: (userId: string) => `voice:user:${userId}`,
  voiceChannel: (channelId: string) => `voice:channel:${channelId}`,
  presence: (userId: string) => `presence:${userId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  idle: (userId: string) => `idle:${userId}`,
  typing: (channelId: string, userId: string) => `typing:${channelId}:${userId}`,
  webhookRate: (webhookId: string) => `webhook:rate:${webhookId}`,
  slowmode: (channelId: string, userId: string) => `slow:${channelId}:${userId}`,
  uploadQuota: (userId: string) => `upload:bytes:${userId}`,
  messagesFlow: (userId: string) => `fluxo:msg:${userId}`,
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
