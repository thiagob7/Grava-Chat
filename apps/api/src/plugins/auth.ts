import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "~/env.js";
import { ACCESS_TTL } from "~/services/auth-service.js";
import { accessRevoked } from "~/lib/token-revocation.js";

type AccessTokenPayload = { sub: string; iat?: number };

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    userId: string;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: ACCESS_TTL } });

  app.decorateRequest("userId", "");

  app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
    let payload: AccessTokenPayload;

    try {
      payload = await req.jwtVerify<AccessTokenPayload>();
    } catch {
      return reply.unauthorized("Sessão inválida ou expirada");
    }

    if (await accessRevoked(payload.sub, payload.iat)) {
      return reply.unauthorized("Sessão inválida ou expirada");
    }

    req.userId = payload.sub;
  });
});
