import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { objectId } from "@gravae/shared";
import { rooms } from "@gravae/shared";
import { friendshipService } from "~/services/friendship-service.js";
import { io } from "~/realtime/io.js";
import {
  requestFriendInput,
  friendshipParams,
  respondFriendInput,
  openDmInput,
  responderPedidoDeDmInput,
} from "~/validations/friendship.js";

const notificar = (...userIds: string[]) => {
  for (const id of userIds) io().to(rooms.user(id)).emit("friend:updated");
};

export async function friendRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/friends", (req) => friendshipService.list(req.userId));

  app.get("/friends/ativos", (req) => friendshipService.ativosAgora(req.userId));

  app.post("/friends", async (req, reply) => {
    const { username } = requestFriendInput.parse(req.body);
    const { relacao, aceitou } = await friendshipService.request(req.userId, username);

    notificar(relacao.requesterId, relacao.addresseeId);
    return reply.code(201).send({ aceitou });
  });

  app.post("/friends/:friendshipId/respond", async (req) => {
    const { friendshipId } = friendshipParams.parse(req.params);
    const { accept } = respondFriendInput.parse(req.body);

    const relacao = await friendshipService.respond(req.userId, friendshipId, accept);
    if (relacao) notificar(relacao.requesterId, relacao.addresseeId);
    else notificar(req.userId);

    return { accepted: Boolean(relacao) };
  });

  app.delete("/friends/:friendshipId", async (req, reply) => {
    const { friendshipId } = friendshipParams.parse(req.params);
    await friendshipService.remove(req.userId, friendshipId);
    notificar(req.userId);
    return reply.code(204).send();
  });

  app.post("/friends/block", async (req, reply) => {
    const { userId } = z.object({ userId: objectId }).parse(req.body);
    await friendshipService.block(req.userId, userId);

    return reply.code(204).send();
  });

  app.delete("/friends/block/:userId", async (req, reply) => {
    const { userId } = z.object({ userId: objectId }).parse(req.params);
    await friendshipService.unblock(req.userId, userId);

    return reply.code(204).send();
  });

  app.get("/dms", (req) => friendshipService.listDms(req.userId));

  app.post("/dms", async (req) => {
    const { userId } = openDmInput.parse(req.body);
    const { canal, pedido } = await friendshipService.openDm(req.userId, userId);

    io()
      .to(rooms.user(userId))
      .emit(pedido ? "dm:pedido" : "dm:created", { channelId: canal.id });

    return { ...canal, pedido };
  });

  app.get("/dms/pedidos", (req) => friendshipService.listPedidos(req.userId));

  app.post("/dms/pedidos/:channelId", async (req) => {
    const { channelId } = z.object({ channelId: objectId }).parse(req.params);
    const { acao } = responderPedidoDeDmInput.parse(req.body);

    const resultado = await friendshipService.responderPedido(req.userId, channelId, acao);

    io().to(rooms.user(req.userId)).emit("dm:pedido", { channelId });
    if (resultado.aceito) io().to(rooms.user(req.userId)).emit("dm:created", { channelId });

    return resultado;
  });
}
