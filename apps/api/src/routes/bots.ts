import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { rooms } from "@gravae/shared";

import { io } from "~/realtime/io.js";
import { botService } from "~/services/bot-service.js";
import { objectId } from "~/validations/common.js";

const botParams = z.object({ botId: objectId });
const botNoServidor = z.object({ botId: objectId, guildId: objectId });
const criarBody = z.object({ nome: z.string().trim().min(2).max(32) });

const editarBody = z.object({
  nome: z.string().trim().min(2).max(32).optional(),
  descricao: z.string().trim().max(300).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  permissoesPedidas: z.array(z.string().max(40)).max(40).optional(),
  publico: z.boolean().optional(),
  redirectUris: z.array(z.string().url()).max(10).optional(),
});

export async function botRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/bots", (req) => botService.listar(req.userId));

  app.post("/bots", (req) => botService.criar(req.userId, criarBody.parse(req.body).nome));

  app.patch("/bots/:botId", (req) =>
    botService.editar(req.userId, botParams.parse(req.params).botId, editarBody.parse(req.body)),
  );

  app.post("/bots/:botId/token", (req) =>
    botService.regenerarToken(req.userId, botParams.parse(req.params).botId),
  );

  app.delete("/bots/:botId", async (req, reply) => {
    await botService.apagar(req.userId, botParams.parse(req.params).botId);
    return reply.status(204).send();
  });

  app.get("/bots/:botId/convite", (req) =>
    botService.paraConvidar(botParams.parse(req.params).botId),
  );

  app.get("/bots/:botId/destinos", (req) =>
    botService.destinosPara(req.userId, botParams.parse(req.params).botId),
  );

  app.get("/bots/:botId/servidores", (req) =>
    botService.servidoresDe(botParams.parse(req.params).botId),
  );

  const avisarComandos = (guildId: string) =>
    io().to(rooms.guild(guildId)).emit("commands:changed", { guildId });

  app.put("/bots/:botId/servidores/:guildId", async (req) => {
    const { botId, guildId } = botNoServidor.parse(req.params);
    const entrada = await botService.adicionarAoServidor(req.userId, botId, guildId);

    avisarComandos(guildId);
    return entrada;
  });

  app.delete("/bots/:botId/servidores/:guildId", async (req, reply) => {
    const { botId, guildId } = botNoServidor.parse(req.params);
    await botService.removerDoServidor(req.userId, botId, guildId);

    avisarComandos(guildId);
    return reply.status(204).send();
  });
}
