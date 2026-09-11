import { buildApp } from "~/app.js";
import { env } from "~/env.js";
import { prisma } from "~/lib/prisma.js";
import { closeIo } from "~/realtime/io.js";
import { redis } from "~/lib/redis.js";
import { createGateway } from "~/realtime/gateway.js";
import { guildEventService } from "~/services/guild-event-service.js";
import { deletionService } from "~/services/exclusao-service.js";
import { systemService } from "~/services/sistema-service.js";
import { statusService } from "~/services/status-service.js";

const app = await buildApp();

let stopWatchDeletions: (() => void) | null = null;
let stopWatchStatus: (() => void) | null = null;
let stopWatchingEvents: (() => void) | null = null;

try {
  await createGateway(app);
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info("gateway de tempo real pronto");

  stopWatchDeletions = deletionService.watch(app.log);
  stopWatchStatus = statusService.watch(app.log);
  stopWatchingEvents = guildEventService.watch(app.log);

  void systemService.removeServers(app.log).catch((err) => app.log.error(err));
  void systemService.seedThemesServer(app.log).catch((err) => app.log.error(err));
  void systemService
    .seedDevelopersServer(app.log)
    .catch((err) => app.log.error(err));
  void systemService.seedHouse(app.log).catch((err) => app.log.error(err));
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

const OUTPUT_MS_DEADLINE = 5000;

let leaving = false;

const shutdown = async (signal: string) => {
  if (leaving) return;
  leaving = true;

  app.log.info({ signal }, "encerrando");

  const force = setTimeout(() => {
    app.log.warn("encerramento demorou demais; saindo à força");
    process.exit(0);
  }, OUTPUT_MS_DEADLINE);
  force.unref();

  stopWatchDeletions?.();
  stopWatchStatus?.();
  stopWatchingEvents?.();

  await closeIo().catch(() => undefined);
  await app.close().catch(() => undefined);
  await Promise.allSettled([prisma.$disconnect(), redis.quit()]);

  clearTimeout(force);
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
