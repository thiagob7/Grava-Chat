import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "~/env.js";
import { ACCESS_TTL } from "~/services/auth-service.js";

type AccessTokenPayload = { sub: string };

declare module "fastify" {
  interface FastifyInstance {
    /** preHandler: exige um access token valido e popula request.userId */
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
    try {
      const payload = await req.jwtVerify<AccessTokenPayload>();
      req.userId = payload.sub;
    } catch {
      return reply.unauthorized("Sessão inválida ou expirada");
    }
  });
});
