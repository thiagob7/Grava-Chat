import { buildApp } from "~/app.js";
import { env } from "~/env.js";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { createGateway } from "~/realtime/gateway.js";
import { exclusaoService } from "~/services/exclusao-service.js";

const app = await buildApp();

let pararDeVigiarExclusoes: (() => void) | null = null;

try {
  await createGateway(app);
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info("gateway de tempo real pronto");

  /// O relógio que apaga as contas cujo prazo de quinze dias venceu. É a única
  /// parte irreversível do fluxo — tudo antes dela é reversível de propósito.
  pararDeVigiarExclusoes = exclusaoService.vigiar(app.log);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "encerrando");
  pararDeVigiarExclusoes?.();
  await app.close();
  await Promise.allSettled([prisma.$disconnect(), redis.quit()]);
  process.exit(0);
};

process.on("unhandledRejection", (reason) => {
  app.log.error({ err: reason }, "rejeição não tratada — investigar");
});

process.on("uncaughtException", (err) => {
  app.log.error({ err }, "exceção não capturada — investigar");
});

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
