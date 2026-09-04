import Redis from "ioredis";
import { env } from "~/env.js";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export function vigiar(cliente: Redis, nome: string) {
  cliente.on("error", (erro) => console.error(`[redis:${nome}]`, erro.message));
  return cliente;
}

vigiar(redis, "principal");

export const keys = {
  voiceState: (userId: string) => `voice:user:${userId}`,
  voiceChannel: (channelId: string) => `voice:channel:${channelId}`,
  presence: (userId: string) => `presence:${userId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  idle: (userId: string) => `idle:${userId}`,
  typing: (channelId: string, userId: string) => `typing:${channelId}:${userId}`,
  webhookRate: (webhookId: string) => `webhook:rate:${webhookId}`,
  slowmode: (channelId: string, userId: string) => `slow:${channelId}:${userId}`,
  cotaDeUpload: (userId: string) => `upload:bytes:${userId}`,
  fluxoDeMensagens: (userId: string) => `fluxo:msg:${userId}`,
  desktopLogin: (codigo: string) => `desktop-login:${codigo}`,
  oauthCode: (codigo: string) => `oauth:code:${codigo}`,
  oauthToken: (token: string) => `oauth:token:${token}`,
  oauthDaPessoa: (userId: string) => `oauth:usuario:${userId}`,
} as const;
