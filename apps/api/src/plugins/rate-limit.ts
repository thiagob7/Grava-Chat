import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { redis } from "~/lib/redis.js";
import { politicaDeVazao } from "~/lib/vazao.js";

export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    global: true,
    ...politicaDeVazao,

    redis,
    nameSpace: "rl:",
  });
});
