import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { redis } from "~/lib/redis.js";
import { politicaDeVazao } from "~/lib/vazao.js";

export const rateLimitPlugin = fp(async (app) => {
  await app.register(rateLimit, {
    global: true,
    ...politicaDeVazao,

    /*
      Estado no Redis, e não em memória, por dois motivos. O contador sobrevive
      ao restart — e `deploy-api.sh` reinicia o processo, o que zeraria a
      contagem de quem estivesse martelando a API justo naquele minuto. E o dia
      em que houver um segundo processo, o limite continua sendo um só.
    */
    redis,
    nameSpace: "rl:",
  });
});
