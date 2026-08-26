import { has, rooms, type ComandoDeBot } from "@gravae/shared";

import { AppError, ForbiddenError } from "~/lib/http.js";
import { toMessage, toPublicUser } from "~/lib/serialize.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { botService } from "~/services/bot-service.js";
import { messageService } from "~/services/message-service.js";
import { io } from "./io.js";

/**
 * Gravar e avisar, num lugar só.
 *
 * Escrever uma mensagem tem sempre duas metades: o service grava, e o
 * `io().to(...).emit(...)` conta para quem está com o canal aberto. Sem a
 * segunda, a mensagem entra no banco e ninguém vê até dar refresh.
 *
 * As duas metades viviam dentro dos handlers do socket. Com a API REST de
 * bot fazendo o mesmo trabalho por outra porta, ou isto virava um módulo
 * comum ou as duas cópias iam divergir — e a que ia ficar para trás é
 * justamente a que ninguém testa clicando.
 */

/**
 * `exceto` é o socket de quem mandou.
 *
 * Quem envia pelo WebSocket precisa receber a mensagem com o `nonce` de
 * volta, para casar com o que já desenhou na tela; todo o resto do canal
 * recebe sem. Pela API REST não existe esse alguém, e aí o `emit` é para
 * todos.
 */
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

  /// A animação vai num evento próprio, e não junto da contagem: quem acabou
  /// de abrir o canal recebe as reações pelo histórico e não pode levar com
  /// uma chuva de emoji de algo que aconteceu antes de chegar.
  if (burst) {
    io().to(rooms.channel(channelId)).emit("message:super", { messageId, channelId, emoji, userId });
  }

  return { messageId, emoji, channelId, reactions };
}

/**
 * Como o comando fica escrito no canal.
 *
 * Só as opções que vieram, na ordem em que o bot as declarou — assim a linha
 * do histórico se parece com o que a pessoa digitou, e não com um objeto.
 *
 * Pessoa e canal voltam para a marcação `<@id>` e `<#id>`. O valor convertido
 * é um id de 24 caracteres: certo para o bot, ilegível no meio de uma frase.
 * Com a marcação, quem lê o histórico vê "@Thiago" e "#geral", que é o que
 * quem digitou escolheu na lista.
 */
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

/**
 * Um comando de barra, do clique até o bot.
 *
 * Três coisas acontecem, nesta ordem, e a ordem importa: valida, deixa o
 * rastro no canal, entrega ao bot. O rastro vem ANTES da entrega porque o
 * evento leva o `messageId` — o bot responde citando a linha "fulano usou
 * /play", e ela precisa existir para ser citada.
 */
export async function invocarComando(
  userId: string,
  input: { channelId: string; botId: string; comando: string; opcoes: Record<string, string> },
) {
  const { channel, contexto } = await accessService.requireChannelAccess(userId, input.channelId);

  /// Comando é de servidor. Numa DM não existe "o bot está aqui" para
  /// consultar, e o `guildId` que a validação precisa não existe.
  if (!channel.guildId || !contexto) {
    throw new AppError("Comandos de barra só funcionam em servidor", 400);
  }

  /// A mesma permissão de escrever: o comando vira mensagem no canal, e quem
  /// não pode falar ali não pode fazer o bot falar por ele.
  if (!has(contexto.permissions, "SEND_MESSAGES")) {
    throw new ForbiddenError("Você não pode escrever neste canal");
  }

  const { bot, comando, opcoes } = await botService.resolverInvocacao({
    guildId: channel.guildId,
    botId: input.botId,
    comando: input.comando,
    opcoes: input.opcoes,
  });

  /*
    As pessoas escolhidas em opções `usuario` contam como menção.

    Não é enfeite: é o que faz `/expulsar @fulano` notificar o fulano. Escrever
    `<@id>` no conteúdo sem registrar aqui desenharia a menção sem avisar
    ninguém — o pior dos dois mundos.
  */
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
