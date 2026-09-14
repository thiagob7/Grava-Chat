import type { FastifyRequest } from "fastify";
import type { RateLimitOptions } from "@fastify/rate-limit";

import { clientIp } from "~/lib/ip-do-cliente.js";

const CEILING_BY_MINUTE = 300;

export const throughputPolicy = {
  max: CEILING_BY_MINUTE,
  timeWindow: "1 minute",

  skipOnError: true,

  allowList: (req: FastifyRequest) => req.url === "/api/health",

  keyGenerator: (req: FastifyRequest) => {
    const authorization = req.headers.authorization;

    if (authorization?.startsWith("Bearer ")) {
      try {
        const { sub } = req.server.jwt.verify<{ sub: string }>(authorization.slice(7));
        return `usuario:${sub}`;
      } catch {
        return clientIp(req);
      }
    }

    return clientIp(req);
  },

  errorResponseBuilder: (_req: FastifyRequest, ctx: { ttl: number }) => ({
    statusCode: 429,
    message: `Calma aí — muitas requisições seguidas. Tente de novo em ${Math.ceil(ctx.ttl / 1000)}s.`,
  }),
} satisfies RateLimitOptions;
