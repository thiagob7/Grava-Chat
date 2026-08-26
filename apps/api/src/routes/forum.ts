import type { FastifyInstance } from "fastify";
import { rooms, objectId, LIMITS } from "@gravae/shared";
import { z } from "zod";
import { io } from "~/realtime/io.js";
import { forumService } from "~/services/forum-service.js";
import { channelParams } from "~/validations/common.js";

const postParams = z.object({ postId: objectId });

const listQuery = z.object({
  before: objectId.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

const createPostInput = z.object({
  title: z.string().min(1).max(LIMITS.postTitulo),
  content: z.string().min(1).max(LIMITS.messageLength),
  tags: z.array(z.string().min(1).max(24)).max(5).optional(),
});

export async function forumRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/channels/:channelId/posts", (req) => {
    const { channelId } = channelParams.parse(req.params);
    return forumService.list(req.userId, channelId, listQuery.parse(req.query));
  });

  app.post("/channels/:channelId/posts", async (req, reply) => {
    const { channelId } = channelParams.parse(req.params);
    const criado = await forumService.create(req.userId, channelId, createPostInput.parse(req.body));

    io().to(rooms.channel(channelId)).emit("post:created", criado.post);
    io().to(rooms.channel(channelId)).emit("message:created", criado.message);

    return reply.code(201).send(criado);
  });

  app.get("/posts/:postId", (req) => {
    const { postId } = postParams.parse(req.params);
    return forumService.get(req.userId, postId);
  });

  app.patch("/posts/:postId", async (req) => {
    const { postId } = postParams.parse(req.params);
    const { closed } = z.object({ closed: z.boolean() }).parse(req.body);
    const post = await forumService.fechar(req.userId, postId, closed);

    io().to(rooms.channel(post.channelId)).emit("post:updated", post);
    return post;
  });
}
