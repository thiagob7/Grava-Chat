import { has, rooms, type BotCommand } from "@gravae/shared";

import { AppError, ForbiddenError } from "~/lib/http.js";
import { toMessage, toPublicUser } from "~/lib/serialize.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { botService } from "~/services/bot-service.js";
import { messageService } from "~/services/message-service.js";
import { io } from "./io.js";

export async function sendMessage(
  userId: string,
  input: Parameters<typeof messageService.send>[1],
  except?: string,
) {
  const message = await messageService.send(userId, input);
  const room = io().to(rooms.channel(input.channelId));

  if (except) room.except(except).emit("message:created", message);
  else room.emit("message:created", message);

  return message;
}

export async function editMessage(
  userId: string,
  input: Parameters<typeof messageService.edit>[1],
) {
  const message = await messageService.edit(userId, input);
  io().to(rooms.channel(message.channelId)).emit("message:updated", message);

  return message;
}

export async function deleteMessage(userId: string, messageId: string) {
  const result = await messageService.remove(userId, messageId);
  io().to(rooms.channel(result.channelId)).emit("message:deleted", result);

  return result;
}

export async function removeAttachment(userId: string, messageId: string, attachmentId: string) {
  const result = await messageService.removeAttachment(userId, messageId, attachmentId);

  if (result.deletedMessage) {
    io()
      .to(rooms.channel(result.channelId))
      .emit("message:deleted", { messageId: result.messageId, channelId: result.channelId });
  } else {
    io().to(rooms.channel(result.channelId)).emit("message:updated", result.message);
  }

  return result;
}

export async function react(
  userId: string,
  messageId: string,
  emoji: string,
  add: boolean,
  burst = false,
) {
  const { channelId, reactions } = await messageService.react(userId, messageId, emoji, add, burst);

  io().to(rooms.channel(channelId)).emit("message:reactions", { messageId, channelId, reactions });

  if (burst) {
    io().to(rooms.channel(channelId)).emit("message:super", { messageId, channelId, emoji, userId });
  }

  return { messageId, emoji, channelId, reactions };
}

function asStaysWritten(command: BotCommand, options: Record<string, string | number>) {
  const parts = command.options
    .filter((o) => options[o.name] !== undefined)
    .map((o) => {
      const value = String(options[o.name]);

      if (o.kind === "usuario") return `<@${value}>`;
      if (o.kind === "canal") return `<#${value}>`;

      return value;
    });

  return [`/${command.name}`, ...parts].join(" ");
}

export async function invokeCommand(
  userId: string,
  input: { channelId: string; botId: string; command: string; options: Record<string, string> },
) {
  const { channel, context } = await accessService.requireChannelAccess(userId, input.channelId);

  if (!channel.guildId || !context) {
    throw new AppError("Comandos de barra só funcionam em servidor", 400);
  }

  if (!has(context.permissions, "SEND_MESSAGES")) {
    throw new ForbiddenError("Você não pode escrever neste canal");
  }

  const { bot, command, options } = await botService.resolveInvocation({
    guildId: channel.guildId,
    botId: input.botId,
    command: input.command,
    options: input.options,
  });

  const mentioned = command.options
    .filter((o) => o.kind === "usuario" && options[o.name] !== undefined)
    .map((o) => String(options[o.name]));

  const created = await messageRepository.create({
    channelId: channel.id,
    authorId: userId,
    kind: "COMANDO",
    content: asStaysWritten(command, options),
    attachments: [],
    replyToId: null,
    mentions: mentioned,
  });

  const message = toMessage(created, userId);
  io().to(rooms.channel(channel.id)).emit("message:created", message);

  const user = await userRepository.findById(userId);

  io().to(rooms.user(bot.botUserId)).emit("command:invoked", {
    channelId: channel.id,
    guildId: channel.guildId,
    messageId: message.id,
    command: command.name,
    options,
    user: toPublicUser(user!),
  });

  return message;
}
