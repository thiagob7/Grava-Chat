import { has, rooms, type ComandoDeBot } from "@gravae/shared";

import { AppError, ForbiddenError } from "~/lib/http.js";
import { toMessage, toPublicUser } from "~/lib/serialize.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { botService } from "~/services/bot-service.js";
import { messageService } from "~/services/message-service.js";
import { io } from "./io.js";

export async function enviarMensagem(
  userId: string,
  input: Parameters<typeof messageService.send>[1],
  exceto?: string,
) {
  const message = await messageService.send(userId, input);
  const sala = io().to(rooms.channel(input.channelId));

  if (exceto) sala.except(exceto).emit("message:created", message);
  else sala.emit("message:created", message);

  return message;
}

export async function editarMensagem(
  userId: string,
  input: Parameters<typeof messageService.edit>[1],
) {
  const message = await messageService.edit(userId, input);
  io().to(rooms.channel(message.channelId)).emit("message:updated", message);

  return message;
}

export async function apagarMensagem(userId: string, messageId: string) {
  const result = await messageService.remove(userId, messageId);
  io().to(rooms.channel(result.channelId)).emit("message:deleted", result);

  return result;
}

export async function reagir(
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

function comoFicaEscrito(comando: ComandoDeBot, opcoes: Record<string, string | number>) {
  const partes = comando.opcoes
    .filter((o) => opcoes[o.nome] !== undefined)
    .map((o) => {
      const valor = String(opcoes[o.nome]);

      if (o.tipo === "usuario") return `<@${valor}>`;
      if (o.tipo === "canal") return `<#${valor}>`;

      return valor;
    });

  return [`/${comando.nome}`, ...partes].join(" ");
}

export async function invocarComando(
  userId: string,
  input: { channelId: string; botId: string; comando: string; opcoes: Record<string, string> },
) {
  const { channel, contexto } = await accessService.requireChannelAccess(userId, input.channelId);

  if (!channel.guildId || !contexto) {
    throw new AppError("Comandos de barra só funcionam em servidor", 400);
  }

  if (!has(contexto.permissions, "SEND_MESSAGES")) {
    throw new ForbiddenError("Você não pode escrever neste canal");
  }

  const { bot, comando, opcoes } = await botService.resolverInvocacao({
    guildId: channel.guildId,
    botId: input.botId,
    comando: input.comando,
    opcoes: input.opcoes,
  });

  const mencionados = comando.opcoes
    .filter((o) => o.tipo === "usuario" && opcoes[o.nome] !== undefined)
    .map((o) => String(opcoes[o.nome]));

  const criada = await messageRepository.create({
    channelId: channel.id,
    authorId: userId,
    tipo: "COMANDO",
    content: comoFicaEscrito(comando, opcoes),
    attachments: [],
    replyToId: null,
    mentions: mencionados,
  });

  const message = toMessage(criada, userId);
  io().to(rooms.channel(channel.id)).emit("message:created", message);

  const usuario = await userRepository.findById(userId);

  io().to(rooms.user(bot.botUserId)).emit("command:invoked", {
    channelId: channel.id,
    guildId: channel.guildId,
    messageId: message.id,
    comando: comando.nome,
    opcoes,
    usuario: toPublicUser(usuario!),
  });

  return message;
}
