import type { Socket } from "socket.io";
import type { z } from "zod";
import type { PresenceStatus } from "@gravae/shared";
import {
  clientEventSchemas,
  rooms,
  type Ack,
  type ClientEventName,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import { toPublicUser } from "~/lib/serialize.js";
import { expressionRepository } from "~/repositories/expression-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "~/services/access-service.js";
import { messageService } from "~/services/message-service.js";
import { presenceService } from "~/services/presence-service.js";
import { voiceService, VOICE_GRACE_MS } from "~/services/voice-service.js";
import { io, type SocketData } from "./io.js";

type GravaeSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

/**
 * Envelope único de todo evento: valida o payload com o schema compartilhado,
 * chama o service e responde o ack. Sem isso, cada handler repetiria try/catch
 * e um payload malformado derrubaria o processo (exceção em callback assíncrono
 * de socket não tem quem pegue).
 */
function on<E extends ClientEventName>(
  socket: GravaeSocket,
  event: E,
  handler: (payload: z.infer<(typeof clientEventSchemas)[E]>, socket: GravaeSocket) => Promise<unknown>,
) {
  // O Socket tipado exige a assinatura exata de cada evento; aqui o listener é
  // genérico de propósito, então passamos pela versão sem tipos do .on().
  const listen = socket.on.bind(socket) as (
    e: string,
    l: (raw: unknown, ack?: Ack<unknown>) => void,
  ) => void;

  listen(event, async (raw: unknown, ack?: Ack<unknown>) => {
    const parsed = clientEventSchemas[event].safeParse(raw);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Payload inválido";
      ack?.({ ok: false, error: message });
      socket.emit("error", { event, message });
      return;
    }

    try {
      const data = await handler(parsed.data as never, socket);
      ack?.({ ok: true, data: data ?? null });
    } catch (err) {
      const isDomainError = err instanceof AppError;
      const message = isDomainError ? err.message : "Erro inesperado";

      if (!isDomainError) console.error(`[socket:${event}]`, err);

      ack?.({ ok: false, error: message });
      socket.emit("error", { event, message });
    }
  });
}

export function registerHandlers(socket: GravaeSocket) {
  const userId = socket.data.userId;

  // ------------------------------- canais ---------------------------------

  on(socket, "channel:subscribe", async ({ channelId }) => {
    await accessService.requireChannelAccess(userId, channelId);
    await socket.join(rooms.channel(channelId));
    return { channelId };
  });

  on(socket, "channel:unsubscribe", async ({ channelId }) => {
    await socket.leave(rooms.channel(channelId));
    return { channelId };
  });

  // ------------------------------ mensagens --------------------------------

  on(socket, "message:send", async (payload) => {
    const message = await messageService.send(userId, payload);

    /**
     * O nonce volta só pro autor: é como o cliente troca a mensagem otimista
     * (a que já apareceu na tela) pela real, sem duplicar nem piscar.
     */
    const room = io().to(rooms.channel(payload.channelId));
    room.except(socket.id).emit("message:created", message);
    socket.emit("message:created", { ...message, nonce: payload.nonce });

    return { id: message.id };
  });

  on(socket, "message:edit", async (payload) => {
    const message = await messageService.edit(userId, payload);
    io().to(rooms.channel(message.channelId)).emit("message:updated", message);
    return { id: message.id };
  });

  on(socket, "message:delete", async ({ messageId }) => {
    const result = await messageService.remove(userId, messageId);
    io().to(rooms.channel(result.channelId)).emit("message:deleted", result);
    return { id: messageId };
  });

  const broadcastReactions = async (messageId: string, emoji: string, add: boolean) => {
    const { channelId, reactions } = await messageService.react(userId, messageId, emoji, add);

    // Uma emissão para a sala inteira; cada cliente resolve o próprio "me" a
    // partir dos ids. Ver a nota em reactionStateSchema.
    io().to(rooms.channel(channelId)).emit("message:reactions", { messageId, channelId, reactions });
    return { messageId, emoji };
  };

  on(socket, "message:react", ({ messageId, emoji }) => broadcastReactions(messageId, emoji, true));
  on(socket, "message:unreact", ({ messageId, emoji }) => broadcastReactions(messageId, emoji, false));

  on(socket, "message:ack", async ({ channelId, messageId }) => {
    await messageService.markRead(userId, channelId, messageId);
    return { channelId };
  });

  // -------------------------- digitando / presença --------------------------

  on(socket, "poll:vote", async ({ messageId, optionId }) => {
    const message = await messageService.votar(userId, messageId, optionId);
    io().to(rooms.channel(message.channelId)).emit("message:updated", message);

    return { id: message.id };
  });

  on(socket, "poll:close", async ({ messageId }) => {
    const message = await messageService.encerrarEnquete(userId, messageId);
    io().to(rooms.channel(message.channelId)).emit("message:updated", message);

    return { id: message.id };
  });

  on(socket, "typing:start", async ({ channelId }) => {
    await accessService.requireChannelAccess(userId, channelId);
    const user = await userRepository.findByIdOrThrow(userId);

    // só pros outros: ver o próprio "digitando" seria estranho
    socket.to(rooms.channel(channelId)).emit("typing:started", { channelId, user: toPublicUser(user) });
    return null;
  });

  on(socket, "presence:update", async ({ status }) => {
    await presenceService.set(userId, status);
    await broadcastPresence(userId, status);
    return { status };
  });

  // --------------------------------- voz -----------------------------------

  on(socket, "voice:join", async ({ channelId, resume }) => {
    const { state, left } = await voiceService.join(userId, channelId, socket.id, resume);
    socket.data.voiceChannelId = channelId;

    if (left) announceLeave(left.guildId, left.channelId, userId);

    /**
     * O evento vai pra sala do SERVIDOR, não do canal: quem está em #geral
     * também precisa ver quem entrou na Sala 1 na barra lateral.
     */
    io().to(rooms.guild(state.guildId)).emit("voice:joined", state);
    return state;
  });

  on(socket, "voice:leave", async () => {
    const state = await voiceService.leave(userId);
    socket.data.voiceChannelId = null;

    if (state) announceLeave(state.guildId, state.channelId, userId);
    return state ? { channelId: state.channelId } : null;
  });

  on(socket, "voice:state", async (patch) => {
    const state = await voiceService.update(userId, patch);
    io().to(rooms.guild(state.guildId)).emit("voice:updated", state);
    return state;
  });

  /**
   * Efeito sonoro: o servidor não mixa nada na chamada — manda o endereço do
   * arquivo e cada cliente toca. Mixar na track significaria republicar áudio a
   * cada clique, o que pica a conversa de todo mundo.
   */
  on(socket, "voice:sound", async ({ soundId }) => {
    const estado = await voiceService.get(userId);
    if (!estado) throw new AppError("Você não está numa chamada");

    const contexto = await accessService.requirePermission(
      userId,
      estado.guildId,
      "USE_SOUNDBOARD",
      estado.channelId,
    );
    void contexto;

    const som = await expressionRepository.findSoundById(soundId);
    if (!som || som.guildId !== estado.guildId) throw new NotFoundError("Som não encontrado");

    io()
      .to(rooms.guild(estado.guildId))
      .emit("voice:sound", {
        channelId: estado.channelId,
        userId,
        url: som.url,
        volume: som.volume,
      });

    return { id: som.id };
  });

  on(socket, "voice:moderate", async ({ userId: alvoId, serverMute, serverDeaf }) => {
    const estado = await voiceService.get(alvoId);
    if (!estado) throw new NotFoundError("Esta pessoa não está numa chamada");

    if (serverMute !== undefined) {
      await accessService.requirePermission(userId, estado.guildId, "MUTE_MEMBERS");
    }
    if (serverDeaf !== undefined) {
      await accessService.requirePermission(userId, estado.guildId, "DEAFEN_MEMBERS");
    }

    const atualizado = await voiceService.moderar(alvoId, { serverMute, serverDeaf });
    if (atualizado) io().to(rooms.guild(atualizado.guildId)).emit("voice:updated", atualizado);

    return atualizado;
  });

  on(socket, "voice:kick", async ({ userId: alvoId }) => {
    const estado = await voiceService.get(alvoId);
    if (!estado) throw new NotFoundError("Esta pessoa não está numa chamada");

    await accessService.requirePermission(userId, estado.guildId, "MOVE_MEMBERS");
    await voiceService.desconectarDoSfu(estado.channelId, alvoId);

    const saiu = await voiceService.leave(alvoId);
    if (saiu) announceLeave(saiu.guildId, saiu.channelId, alvoId);

    io().to(rooms.user(alvoId)).emit("voice:move", { channelId: "" });
    return { userId: alvoId };
  });

  /**
   * Mover: o servidor tira a pessoa da sala de mídia antiga e AVISA a aba dela
   * pra entrar na nova. Não dá pra "empurrar" alguém para outra sala do SFU —
   * quem conecta é sempre o cliente, com o token dele.
   */
  on(socket, "voice:moveMember", async ({ userId: alvoId, channelId }) => {
    const estado = await voiceService.get(alvoId);
    if (!estado) throw new NotFoundError("Esta pessoa não está numa chamada");

    await accessService.requirePermission(userId, estado.guildId, "MOVE_MEMBERS");

    const { channel } = await accessService.requireChannelAccess(alvoId, channelId);
    if (channel.type !== "VOICE") throw new AppError("Só dá pra mover para canal de voz");

    await voiceService.desconectarDoSfu(estado.channelId, alvoId);
    io().to(rooms.user(alvoId)).emit("voice:move", { channelId });

    return { userId: alvoId, channelId };
  });
}

/**
 * Sempre na sala do SERVIDOR, nunca na do canal: ninguém se inscreve na sala de
 * um canal de voz, então um aviso mandado pra lá não chegaria em ninguém.
 */
function announceLeave(guildId: string, channelId: string, userId: string) {
  io().to(rooms.guild(guildId)).emit("voice:left", { channelId, userId });
}

/**
 * Presença muda pra todos os servidores em que a pessoa está.
 *
 * Fica aqui e não no service de propósito: o service não conhece Socket.IO — é
 * isso que permite testá-lo sem subir servidor. Quem publica é a camada de
 * tempo real.
 */
export async function broadcastPresence(userId: string, status: PresenceStatus) {
  const memberships = await memberRepository.guildIdsOf(userId);

  io()
    .to(memberships.map((m) => rooms.guild(m.guildId)))
    .emit("presence:changed", { userId, status });
}

/**
 * Fechou a aba, caiu a internet, deu reload: a conexão dona sumiu.
 *
 * Não encerra na hora. Marca como órfão e espera a janela de tolerância — um
 * reload reconecta em ~2s e a pessoa espera continuar na chamada, que é o que o
 * Discord faz. Se ninguém reassumir, aí sim encerra e avisa o servidor.
 */
export async function cleanupVoiceOnDisconnect(userId: string, socketId: string) {
  const orphaned = await voiceService.orphan(userId, socketId);
  if (!orphaned) return;

  setTimeout(() => {
    void voiceService
      .reapOrphan(userId, socketId)
      .then((state) => {
        if (state) announceLeave(state.guildId, state.channelId, userId);
      })
      .catch(() => undefined);
  }, VOICE_GRACE_MS).unref();
}
