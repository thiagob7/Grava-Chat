import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { redis } from "~/lib/redis.js";
import { throughputPolicy } from "~/lib/vazao.js";

export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    global: true,
    ...throughputPolicy,

    redis,
    nameSpace: "rl:",
  });
});
