import Redis from "ioredis";
import { env } from "~/env.js";

/**
 * Uma conexao normal pra comandos. O adapter do Socket.IO cria as dele
 * (pub/sub exigem conexoes dedicadas — uma conexao em modo subscribe nao
 * aceita mais nenhum outro comando).
 */
export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const keys = {
  voiceState: (userId: string) => `voice:user:${userId}`,
  voiceChannel: (channelId: string) => `voice:channel:${channelId}`,
  presence: (userId: string) => `presence:${userId}`,
  /** contador de sockets abertos por usuario: 3 abas = 3, so fica offline no 0 */
  sessions: (userId: string) => `sessions:${userId}`,
  /**
   * Ausencia detectada pelo cliente, com TTL.
   *
   * Chave SEPARADA da `presence:` de proposito. Se a inatividade escrevesse na
   * mesma chave do status escolhido, voltar do ausente esqueceria que a pessoa
   * estava em "nao perturbe" — o status manual e o automatico precisam
   * coexistir, e e a projecao que decide qual vence.
   */
  idle: (userId: string) => `idle:${userId}`,
  typing: (channelId: string, userId: string) => `typing:${channelId}:${userId}`,
  /** janela de vazão do webhook — ver webhook-service */
  webhookRate: (webhookId: string) => `webhook:rate:${webhookId}`,
  /** modo lento: existe enquanto a pessoa ainda não pode falar de novo */
  slowmode: (channelId: string, userId: string) => `slow:${channelId}:${userId}`,
  /** código de uso único que o navegador devolve pro aplicativo de desktop */
  desktopLogin: (codigo: string) => `desktop-login:${codigo}`,
} as const;
