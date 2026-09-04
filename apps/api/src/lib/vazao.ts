import type { FastifyRequest } from "fastify";
import type { RateLimitOptions } from "@fastify/rate-limit";

const TETO_POR_MINUTO = 300;

export const politicaDeVazao = {
  max: TETO_POR_MINUTO,
  timeWindow: "1 minute",

  skipOnError: true,

  allowList: (req: FastifyRequest) => req.url === "/api/health",

  keyGenerator: (req: FastifyRequest) => req.ip,

  errorResponseBuilder: (_req: FastifyRequest, ctx: { ttl: number }) => ({
    statusCode: 429,
    message: `Calma aí — muitas requisições seguidas. Tente de novo em ${Math.ceil(ctx.ttl / 1000)}s.`,
  }),
} satisfies RateLimitOptions;
