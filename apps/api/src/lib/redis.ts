import Redis from "ioredis";
import { env } from "~/env.js";

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const keys = {
  voiceState: (userId: string) => `voice:user:${userId}`,
  voiceChannel: (channelId: string) => `voice:channel:${channelId}`,
  presence: (userId: string) => `presence:${userId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  idle: (userId: string) => `idle:${userId}`,
  typing: (channelId: string, userId: string) => `typing:${channelId}:${userId}`,
  webhookRate: (webhookId: string) => `webhook:rate:${webhookId}`,
  slowmode: (channelId: string, userId: string) => `slow:${channelId}:${userId}`,
  desktopLogin: (codigo: string) => `desktop-login:${codigo}`,
  /// OAuth2 das aplicações: o código de uso único e o token que ele vira.
  oauthCode: (codigo: string) => `oauth:code:${codigo}`,
  oauthToken: (token: string) => `oauth:token:${token}`,
} as const;
