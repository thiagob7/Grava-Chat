import type { FastifyInstance } from "fastify";
import { rooms } from "@gravae/shared";
import { friendshipService } from "~/services/friendship-service.js";
import { io } from "~/realtime/io.js";
import {
  requestFriendInput,
  friendshipParams,
  respondFriendInput,
  openDmInput,
} from "~/validations/friendship.js";

/** Avisa os dois lados que a lista de amigos mudou. */
const notificar = (...userIds: string[]) => {
  for (const id of userIds) io().to(rooms.user(id)).emit("friend:updated");
};

export async function friendRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/friends", (req) => friendshipService.list(req.userId));

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

  // --------------------------------- DMs -----------------------------------

  app.get("/dms", (req) => friendshipService.listDms(req.userId));

  app.post("/dms", async (req) => {
    const { userId } = openDmInput.parse(req.body);
    const channel = await friendshipService.openDm(req.userId, userId);

    // A outra pessoa precisa ver a conversa aparecer sem recarregar a página.
    io().to(rooms.user(userId)).emit("dm:created", { channelId: channel.id });
    return channel;
  });
}
