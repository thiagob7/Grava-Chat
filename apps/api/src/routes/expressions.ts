import type { FastifyInstance } from "fastify";
import { rooms, objectId } from "@gravae/shared";
import { io } from "~/realtime/io.js";
import { expressionService } from "~/services/expression-service.js";
import { guildParams } from "~/validations/common.js";
import {
  createEmojiInput,
  createSoundInput,
  createStickerInput,
  updateEmojiInput,
  updateSoundInput,
} from "~/validations/expression.js";

const emojiParams = guildParams.extend({ emojiId: objectId });
const stickerParams = guildParams.extend({ stickerId: objectId });
const soundParams = guildParams.extend({ soundId: objectId });

const avisar = (guildId: string) =>
  io().to(rooms.guild(guildId)).emit("expressions:changed", { guildId });

export async function expressionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/guilds/:guildId/expressions", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return expressionService.list(req.userId, guildId);
  });

  app.post("/guilds/:guildId/emojis", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const emoji = await expressionService.createEmoji(
      req.userId,
      guildId,
      createEmojiInput.parse(req.body),
    );

    avisar(guildId);
    return reply.code(201).send(emoji);
  });

  app.patch("/guilds/:guildId/emojis/:emojiId", async (req) => {
    const { guildId, emojiId } = emojiParams.parse(req.params);
    const { name } = updateEmojiInput.parse(req.body);
    const emoji = await expressionService.renameEmoji(req.userId, guildId, emojiId, name);

    avisar(guildId);
    return emoji;
  });

  app.delete("/guilds/:guildId/emojis/:emojiId", async (req, reply) => {
    const { guildId, emojiId } = emojiParams.parse(req.params);
    await expressionService.removeEmoji(req.userId, guildId, emojiId);

    avisar(guildId);
    return reply.code(204).send();
  });

  app.post("/guilds/:guildId/stickers", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const sticker = await expressionService.createSticker(
      req.userId,
      guildId,
      createStickerInput.parse(req.body),
    );

    avisar(guildId);
    return reply.code(201).send(sticker);
  });

  app.delete("/guilds/:guildId/stickers/:stickerId", async (req, reply) => {
    const { guildId, stickerId } = stickerParams.parse(req.params);
    await expressionService.removeSticker(req.userId, guildId, stickerId);

    avisar(guildId);
    return reply.code(204).send();
  });

  app.post("/guilds/:guildId/sounds", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const sound = await expressionService.createSound(
      req.userId,
      guildId,
      createSoundInput.parse(req.body),
    );

    avisar(guildId);
    return reply.code(201).send(sound);
  });

  app.patch("/guilds/:guildId/sounds/:soundId", async (req) => {
    const { guildId, soundId } = soundParams.parse(req.params);
    const sound = await expressionService.updateSound(
      req.userId,
      guildId,
      soundId,
      updateSoundInput.parse(req.body),
    );

    avisar(guildId);
    return sound;
  });

  app.delete("/guilds/:guildId/sounds/:soundId", async (req, reply) => {
    const { guildId, soundId } = soundParams.parse(req.params);
    await expressionService.removeSound(req.userId, guildId, soundId);

    avisar(guildId);
    return reply.code(204).send();
  });
}
