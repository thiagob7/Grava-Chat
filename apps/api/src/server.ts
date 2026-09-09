import { buildApp } from "~/app.js";
import { env } from "~/env.js";
import { prisma } from "~/lib/prisma.js";
import { fecharIo } from "~/realtime/io.js";
import { redis } from "~/lib/redis.js";
import { createGateway } from "~/realtime/gateway.js";
import { guildEventService } from "~/services/guild-event-service.js";
import { exclusaoService } from "~/services/exclusao-service.js";
import { sistemaService } from "~/services/sistema-service.js";
import { statusService } from "~/services/status-service.js";

const app = await buildApp();

let pararDeVigiarExclusoes: (() => void) | null = null;
let pararDeVigiarStatus: (() => void) | null = null;
let stopWatchingEvents: (() => void) | null = null;

try {
  await createGateway(app);
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info("gateway de tempo real pronto");

  pararDeVigiarExclusoes = exclusaoService.vigiar(app.log);
  pararDeVigiarStatus = statusService.vigiar(app.log);
  stopWatchingEvents = guildEventService.watch(app.log);

  void sistemaService.semearServidorDeTemas(app.log).catch((err) => app.log.error(err));
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

const PRAZO_DE_SAIDA_MS = 5000;

let saindo = false;

const shutdown = async (signal: string) => {
  if (saindo) return;
  saindo = true;

  app.log.info({ signal }, "encerrando");

  const forca = setTimeout(() => {
    app.log.warn("encerramento demorou demais; saindo à força");
    process.exit(0);
  }, PRAZO_DE_SAIDA_MS);
  forca.unref();

  pararDeVigiarExclusoes?.();
  pararDeVigiarStatus?.();
  stopWatchingEvents?.();

  await fecharIo().catch(() => undefined);
  await app.close().catch(() => undefined);
  await Promise.allSettled([prisma.$disconnect(), redis.quit()]);

  clearTimeout(forca);
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
