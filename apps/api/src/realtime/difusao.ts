import { has, rooms, type BotCommand, type ComponentRow, type Embed } from "@gravae/shared";

import { AppError, ForbiddenError } from "~/lib/http.js";
import { toMessage, toProfilePublic, toPublicUser } from "~/lib/serialize.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { botService } from "~/services/bot-service.js";
import { interactionService } from "~/services/interaction-service.js";
import { ephemeralService } from "~/services/ephemeral-service.js";
import { messageService, wasReplay } from "~/services/message-service.js";
import { io } from "./io.js";

export async function announceUserUpdated(user: Parameters<typeof toPublicUser>[0]) {
  const guilds = await memberRepository.guildIdsOf(user.id);

  io()
    .to([rooms.user(user.id), ...guilds.map((g) => rooms.guild(g.guildId))])
    .emit("user:updated", { user: toPublicUser(user), profile: toProfilePublic(user) });
}

export async function sendMessage(
  userId: string,
  input: Parameters<typeof messageService.send>[1],
  except?: string,
  extra?: Parameters<typeof messageService.send>[2],
) {
  const message = await messageService.send(userId, input, extra);
  if (wasReplay(message)) return message;

  const room = io().to(rooms.channel(input.channelId));

  if (except) room.except(except).emit("message:created", message);
  else room.emit("message:created", message);

  return message;
}

export async function startInteraction(userId: string, input: Parameters<typeof interactionService.prepare>[1]) {
  const { interaction, event } = await interactionService.prepare(userId, input);

  const listening = await io().in(rooms.user(interaction.botUserId)).fetchSockets();
  if (!listening.length) throw new AppError("O bot está desligado agora", 409);

  await interactionService.store(interaction);
  io().to(rooms.user(interaction.botUserId)).emit("interaction:created", event);

  return { interactionId: interaction.id };
}

export async function submitModal(userId: string, input: Parameters<typeof interactionService.prepareModalSubmit>[1]) {
  const { interaction, event } = await interactionService.prepareModalSubmit(userId, input);

  const listening = await io().in(rooms.user(interaction.botUserId)).fetchSockets();
  if (!listening.length) throw new AppError("O bot está desligado agora", 409);

  if (!(await interactionService.consumeModal(input.modalId))) throw new AppError("Esse formulário já foi enviado", 409);

  await interactionService.store(interaction);
  io().to(rooms.user(interaction.botUserId)).emit("interaction:created", event);

  return { interactionId: interaction.id };
}

export async function sendEphemeral(
  botUserId: string,
  target: { userId: string; channelId: string },
  data: { content?: string; embeds?: Embed[]; components?: ComponentRow[] },
) {
  await accessService.requireChannelAccess(botUserId, target.channelId);

  const bot = await userRepository.findById(botUserId);
  if (!bot) throw new AppError("Bot not found", 404);

  const { message } = await ephemeralService.create({ bot: toPublicUser(bot), ...target, ...data });
  io().to(rooms.user(target.userId)).emit("message:created", message);

  return message;
}

export async function editEphemeral(
  botUserId: string,
  messageId: string,
  changes: { content?: string; embeds?: Embed[]; components?: ComponentRow[] },
) {
  const { userId, message } = await ephemeralService.edit(messageId, botUserId, changes);
  io().to(rooms.user(userId)).emit("message:updated", message);

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

function asStaysWritten(command: BotCommand, options: Record<string, string | number | boolean>) {
  const parts = command.options
    .filter((o) => options[o.name] !== undefined)
    .map((o) => {
      const value = String(options[o.name]);

      if (o.kind === "usuario") return `<@${value}>`;
      if (o.kind === "canal") return `<#${value}>`;
      if (o.kind === "role") return `<@&${value}>`;

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

  const { interaction, token } = interactionService.open({
    kind: "command",
    updatable: false,
    sourceEphemeral: false,
    botUserId: bot.botUserId,
    userId,
    guildId: channel.guildId,
    channelId: channel.id,
    messageId: message.id,
    customId: command.name,
  });
  await interactionService.store(interaction);

  io().to(rooms.user(bot.botUserId)).emit("command:invoked", {
    id: interaction.id,
    token,
    channelId: channel.id,
    guildId: channel.guildId,
    messageId: message.id,
    command: command.name,
    options,
    user: toPublicUser(user!),
  });

  return message;
}
