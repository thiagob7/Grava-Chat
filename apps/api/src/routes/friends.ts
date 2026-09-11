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
  dmInputReplyRequest,
} from "~/validations/friendship.js";

const notify = (...userIds: string[]) => {
  for (const id of userIds) io().to(rooms.user(id)).emit("friend:updated");
};

export async function friendRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/friends", (req) => friendshipService.list(req.userId));

  app.get("/friends/ativos", (req) => friendshipService.activeNow(req.userId));

  app.post("/friends", async (req, reply) => {
    const { username, note } = requestFriendInput.parse(req.body);
    const { relation, accepted } = await friendshipService.request(req.userId, username, note);

    notify(relation.requesterId, relation.addresseeId);
    return reply.code(201).send({ accepted });
  });

  app.post("/friends/:friendshipId/respond", async (req) => {
    const { friendshipId } = friendshipParams.parse(req.params);
    const { accept } = respondFriendInput.parse(req.body);

    const relation = await friendshipService.respond(req.userId, friendshipId, accept);
    if (relation) notify(relation.requesterId, relation.addresseeId);
    else notify(req.userId);

    return { accepted: Boolean(relation) };
  });

  app.delete("/friends/:friendshipId", async (req, reply) => {
    const { friendshipId } = friendshipParams.parse(req.params);
    await friendshipService.remove(req.userId, friendshipId);
    notify(req.userId);
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
    const { channel, request } = await friendshipService.openDm(req.userId, userId);

    io()
      .to(rooms.user(userId))
      .emit(request ? "dm:pedido" : "dm:created", { channelId: channel.id });

    return { ...channel, request };
  });

  app.get("/dms/pedidos", (req) => friendshipService.listRequests(req.userId));

  app.post("/dms/pedidos/:channelId", async (req) => {
    const { channelId } = z.object({ channelId: objectId }).parse(req.params);
    const { action } = dmInputReplyRequest.parse(req.body);

    const result = await friendshipService.replyRequest(req.userId, channelId, action);

    io().to(rooms.user(req.userId)).emit("dm:pedido", { channelId });
    if (result.accepted) io().to(rooms.user(req.userId)).emit("dm:created", { channelId });

    return result;
  });
}
