import { buildApp } from "~/app.js";
import { env } from "~/env.js";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { createGateway } from "~/realtime/gateway.js";

const app = await buildApp();

try {
  /**
   * O gateway entra ANTES do listen: o servidor HTTP ja existe desde a criacao
   * do Fastify, e depois de comecar a ouvir nao da mais pra registrar hooks
   * (FST_ERR_INSTANCE_ALREADY_LISTENING).
   */
  await createGateway(app);
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info("gateway de tempo real pronto");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

/**
 * Desligar limpo importa mais do que parece: sem isso o `tsx watch` deixa
 * conexoes de Mongo penduradas a cada save e em pouco tempo o pool estoura.
 */
const shutdown = async (signal: string) => {
  app.log.info({ signal }, "encerrando");
  await app.close();
  await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
  process.exit(0);
};

/**
 * Rede de seguranca. O Node 22 encerra o processo numa rejeicao nao tratada, e
 * num servidor de tempo real isso significa derrubar TODO mundo por causa de um
 * erro isolado (uma escrita concorrente no Mongo, por exemplo). Registrar e
 * seguir vivo e o comportamento certo aqui — e o log denuncia o que aconteceu.
 */
process.on("unhandledRejection", (reason) => {
  app.log.error({ err: reason }, "rejeição não tratada — investigar");
});

process.on("uncaughtException", (err) => {
  app.log.error({ err }, "exceção não capturada — investigar");
});

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
