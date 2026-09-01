import type { Socket } from "socket.io";
import type { z } from "zod";
import type { PresenceStatus } from "@gravae/shared";
import {
  clientEventSchemas,
  LIMITS,
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
import { voiceService, destinatariosDaVoz, VOICE_GRACE_MS } from "~/services/voice-service.js";
import {
  apagarMensagem,
  editarMensagem,
  enviarMensagem,
  invocarComando,
  reagir,
} from "./difusao.js";
import { io, type SocketData } from "./io.js";

type GravaeSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

function on<E extends ClientEventName>(
  socket: GravaeSocket,
  event: E,
  handler: (payload: z.infer<(typeof clientEventSchemas)[E]>, socket: GravaeSocket) => Promise<unknown>,
) {
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

  on(socket, "channel:subscribe", async ({ channelId }) => {
    await accessService.requireChannelAccess(userId, channelId);
    await socket.join(rooms.channel(channelId));
    return { channelId };
  });

  on(socket, "channel:unsubscribe", async ({ channelId }) => {
    await socket.leave(rooms.channel(channelId));
    return { channelId };
  });

  /*
    O `except(socket.id)` mais o `socket.emit` com o `nonce` são o eco de
    quem mandou: a tela dele já desenhou a mensagem e precisa do `nonce` para
    reconhecer qual das suas era. O resto do canal recebe sem.
  */
  on(socket, "message:send", async (payload) => {
    const message = await enviarMensagem(userId, payload, socket.id);
    socket.emit("message:created", { ...message, nonce: payload.nonce });

    return { id: message.id };
  });

  on(socket, "message:edit", async (payload) => {
    const message = await editarMensagem(userId, payload);
    return { id: message.id };
  });

  on(socket, "message:delete", async ({ messageId }) => {
    await apagarMensagem(userId, messageId);
    return { id: messageId };
  });

  on(socket, "command:invoke", async (payload) => {
    const message = await invocarComando(userId, payload);
    return { messageId: message.id };
  });

  on(socket, "message:react", async ({ messageId, emoji, burst }) => {
    const { messageId: id } = await reagir(userId, messageId, emoji, true, burst ?? false);
    return { messageId: id, emoji };
  });

  on(socket, "message:unreact", async ({ messageId, emoji }) => {
    await reagir(userId, messageId, emoji, false);
    return { messageId, emoji };
  });

  on(socket, "message:ack", async ({ channelId, messageId }) => {
    await messageService.markRead(userId, channelId, messageId);
    return { channelId };
  });

  on(socket, "message:unread", async ({ channelId, messageId }) => {
    await messageService.markUnread(userId, channelId, messageId);
    return { channelId };
  });

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

    socket.to(rooms.channel(channelId)).emit("typing:started", { channelId, user: toPublicUser(user) });
    return null;
  });

  on(socket, "presence:update", async ({ status }) => {
    await presenceService.setDesired(userId, status);
    await broadcastPresence(userId);

    io().to(rooms.user(userId)).emit("presence:self", { status });
    return { status };
  });

  on(socket, "presence:afk", async ({ idle }) => {
    await presenceService.setIdle(userId, idle);
    await broadcastPresence(userId);
    return { idle };
  });

  on(socket, "voice:token", ({ channelId }) => voiceService.issueToken(userId, channelId));

  on(socket, "voice:onde", async ({ userId: alvo }) => {
    const estado = await voiceService.get(alvo);
    return { channelId: estado?.channelId ?? null };
  });

  on(socket, "voice:join", async ({ channelId, resume, cliente }) => {
    const { state, left } = await voiceService.join(
      userId,
      channelId,
      socket.id,
      resume,
      cliente ?? null,
    );
    socket.data.voiceChannelId = channelId;

    if (left) await announceLeave(left.guildId, left.channelId, userId);

    io().to(await destinatariosDaVoz(state)).emit("voice:joined", state);
    return state;
  });

  on(socket, "voice:leave", async () => {
    const state = await voiceService.leave(userId);
    socket.data.voiceChannelId = null;

    if (state) await announceLeave(state.guildId, state.channelId, userId);
    return state ? { channelId: state.channelId } : null;
  });

  on(socket, "voice:state", async (patch) => {
    const state = await voiceService.update(userId, patch);
    io().to(await destinatariosDaVoz(state)).emit("voice:updated", state);
    return state;
  });

  on(socket, "voice:sound", async ({ soundId }) => {
    const estado = await voiceService.get(userId);
    if (!estado) throw new AppError("Você não está numa chamada");

    /*
      A trava vem antes de tudo — inclusive antes de ir ao banco buscar o som.
      Apertar o botão dez vezes seguidas mandava dez sons pra chamada inteira,
      um por cima do outro; quem estava ouvindo não tinha defesa. O cliente
      também trava o botão nesse tempo, mas isso é conforto: a garantia é aqui.
    */
    if (esperandoParaTocar(userId)) throw new AppError("Espera um pouquinho antes do próximo som");

    /*
      Soundboard, moderação, expulsar e mover são poderes de SERVIDOR: existem
      porque existem cargos e permissões atrás deles. No privado não há nem um
      nem outro — e sem a trava, `requirePermission` receberia um `guildId`
      nulo e quebraria com erro interno em vez de dizer o que houve.
    */
    if (!estado.guildId) throw new AppError("O painel de sons só existe em servidor");

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
    if (!estado.guildId) throw new AppError("Não há moderação numa chamada de privado");

    if (serverMute !== undefined) {
      await accessService.requirePermission(userId, estado.guildId, "MUTE_MEMBERS");
    }
    if (serverDeaf !== undefined) {
      await accessService.requirePermission(userId, estado.guildId, "DEAFEN_MEMBERS");
    }

    const atualizado = await voiceService.moderar(alvoId, { serverMute, serverDeaf });
    if (atualizado) io().to(await destinatariosDaVoz(atualizado)).emit("voice:updated", atualizado);

    return atualizado;
  });

  /*
    Recusar a chamada. Só existe no privado — num canal de voz de servidor não
    há ninguém "chamando" você, o canal está lá o tempo todo.

    O `requireChannelAccess` é o que garante que só quem participa da conversa
    pode recusar: ele valida os `recipients` do canal de DM. Sem isso, qualquer
    um com um id de canal derrubaria a chamada dos outros.
  */
  on(socket, "voice:recusar", async ({ channelId }) => {
    const { channel } = await accessService.requireChannelAccess(userId, channelId);
    if (channel.guildId) throw new AppError("Isso só existe numa chamada de privado");

    io()
      .to(channel.recipients.map(rooms.user))
      .emit("voice:recusada", { channelId, userId });

    return { channelId };
  });

  on(socket, "voice:kick", async ({ userId: alvoId }) => {
    const estado = await voiceService.get(alvoId);
    if (!estado) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!estado.guildId) throw new AppError("Não dá pra expulsar de uma chamada de privado");

    await accessService.requirePermission(userId, estado.guildId, "MOVE_MEMBERS");
    await voiceService.desconectarDoSfu(estado.channelId, alvoId);

    const saiu = await voiceService.leave(alvoId);
    if (saiu) await announceLeave(saiu.guildId, saiu.channelId, alvoId);

    io().to(rooms.user(alvoId)).emit("voice:move", { channelId: "" });
    return { userId: alvoId };
  });

  on(socket, "voice:moveMember", async ({ userId: alvoId, channelId }) => {
    const estado = await voiceService.get(alvoId);
    if (!estado) throw new NotFoundError("Esta pessoa não está numa chamada");
    if (!estado.guildId) throw new AppError("Não dá pra mover alguém de uma chamada de privado");

    await accessService.requirePermission(userId, estado.guildId, "MOVE_MEMBERS");

    const { channel } = await accessService.requireChannelAccess(alvoId, channelId);
    if (channel.type !== "VOICE") throw new AppError("Só dá pra mover para canal de voz");

    await voiceService.desconectarDoSfu(estado.channelId, alvoId);
    io().to(rooms.user(alvoId)).emit("voice:move", { channelId });

    return { userId: alvoId, channelId };
  });
}

/*
  Quando cada pessoa tocou seu último som.

  Na memória do processo, e não no Redis: são milissegundos, a API é uma só, e
  perder isso num reinício custa um som a mais na chamada — não vale uma ida à
  rede a cada clique. A limpeza é oportunista, pra tabela não crescer com quem
  saiu faz tempo.
*/
const ultimoSom = new Map<string, number>();

function esperandoParaTocar(userId: string): boolean {
  const agora = Date.now();
  const anterior = ultimoSom.get(userId);

  if (anterior !== undefined && agora - anterior < LIMITS.somEsperaMs) return true;

  if (ultimoSom.size > 500) {
    for (const [id, quando] of ultimoSom) {
      if (agora - quando > LIMITS.somEsperaMs) ultimoSom.delete(id);
    }
  }

  ultimoSom.set(userId, agora);
  return false;
}

async function announceLeave(guildId: string | null, channelId: string, userId: string) {
  const destinos = await destinatariosDaVoz({ guildId, channelId });
  io().to(destinos).emit("voice:left", { channelId, userId });
}

/// De quanto em quanto a varredura roda. Trinta segundos é curto o bastante
/// pra ninguém reclamar do fantasma e longo o bastante pra ser uma chamada só
/// ao SFU por meio minuto.
const INTERVALO_DA_VARREDURA_MS = 30_000;

/*
  Vigia a divergência entre o Redis e o SFU, pra sempre.

  A colheita do órfão cobre a desconexão limpa: o cliente se despede, o
  `setTimeout` corre, tudo certo. Ela NÃO cobre o resto — aba morta sem aviso,
  rede caindo, e principalmente a API reiniciando dentro da janela de 6s, que
  leva o temporizador junto. Nesses casos a pessoa fica na chamada pra sempre.

  Roda uma vez na subida de propósito: é ali que estão os fantasmas que o
  processo anterior deixou pra trás.
*/
export function vigiarChamadasFantasma(aoErrar: (err: unknown) => void) {
  const varrer = () =>
    voiceService
      .reconciliar()
      .then(({ doRedis }) => {
        /// Só os do Redis precisam de anúncio: quem foi expulso do SFU some da
        /// tela sozinho, porque o LiveKit avisa os clientes da própria sala.
        for (const estado of doRedis) {
          void announceLeave(estado.guildId, estado.channelId, estado.userId);
        }
      })
      .catch(aoErrar);

  void varrer();

  const relogio = setInterval(() => void varrer(), INTERVALO_DA_VARREDURA_MS);
  relogio.unref();

  return () => clearInterval(relogio);
}

export async function broadcastPresence(userId: string, status?: PresenceStatus) {
  const projetado = status ?? (await presenceService.mapFor([userId]))[userId] ?? "OFFLINE";
  const memberships = await memberRepository.guildIdsOf(userId);

  io()
    .to(memberships.map((m) => rooms.guild(m.guildId)))
    .emit("presence:changed", { userId, status: projetado });
}

export async function cleanupVoiceOnDisconnect(userId: string, socketId: string) {
  const orphaned = await voiceService.orphan(userId, socketId);
  if (!orphaned) return;

  setTimeout(() => {
    void voiceService
      .reapOrphan(userId, socketId)
      .then((state) => {
        if (state) void announceLeave(state.guildId, state.channelId, userId);
      })
      .catch(() => undefined);
  }, VOICE_GRACE_MS).unref();
}
