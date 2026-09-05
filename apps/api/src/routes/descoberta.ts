import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { rooms } from "@gravae/shared";

import { io } from "~/realtime/io.js";
import { descobertaService } from "~/services/descoberta-service.js";
import { guildService } from "~/services/guild-service.js";
import { objectId } from "~/validations/common.js";

const filtro = z.object({
  categoria: z.string().optional(),
  busca: z.string().max(100).optional(),
});

const params = z.object({ guildId: objectId });

export async function descobertaRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/descobrir", (req) => descobertaService.listar(req.userId, filtro.parse(req.query)));

  app.post("/descobrir/:guildId/entrar", async (req) => {
    const { guildId } = params.parse(req.params);
    const resultado = await descobertaService.entrar(req.userId, guildId);

    if (resultado.member) {
      io().to(rooms.guild(guildId)).emit("member:joined", resultado.member);
      io().in(rooms.user(req.userId)).socketsJoin(rooms.guild(guildId));

      const saudacao = await guildService.boasVindas(guildId, req.userId);
      if (saudacao) io().to(rooms.channel(saudacao.channelId)).emit("message:created", saudacao);
    }

    return { guildId, jaEraMembro: resultado.jaEraMembro };
  });
}
