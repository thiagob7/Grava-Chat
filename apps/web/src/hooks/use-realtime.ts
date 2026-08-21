import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { GuildMember, Message, PresenceStatus, VoiceState, Channel } from "@gravae/shared";

import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import type { MessagePageModel, PendingMessageModel } from "~/@core/domain/models/message-model";
import { connectSocket, disconnectSocket, socket } from "~/@core/lib/websocket";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import { onMessageCreated, offMessageCreated } from "~/@core/lib/websocket/on-message-created";
import { onMessageUpdated, offMessageUpdated } from "~/@core/lib/websocket/on-message-updated";
import { onMessageDeleted, offMessageDeleted } from "~/@core/lib/websocket/on-message-deleted";
import { onMessageReactions, offMessageReactions } from "~/@core/lib/websocket/on-message-reactions";
import { onTypingStarted, offTypingStarted } from "~/@core/lib/websocket/on-typing-started";
import { onPresenceChanged, offPresenceChanged } from "~/@core/lib/websocket/on-presence-changed";
import { onChannelCreated, offChannelCreated } from "~/@core/lib/websocket/on-channel-created";
import { onChannelUpdated, offChannelUpdated } from "~/@core/lib/websocket/on-channel-updated";
import { onChannelDeleted, offChannelDeleted } from "~/@core/lib/websocket/on-channel-deleted";
import { onGuildUpdated, offGuildUpdated } from "~/@core/lib/websocket/on-guild-updated";
import { onGuildDeleted, offGuildDeleted } from "~/@core/lib/websocket/on-guild-deleted";
import { onGuildRefresh, offGuildRefresh } from "~/@core/lib/websocket/on-guild-refresh";
import {
  onExpressionsChanged,
  offExpressionsChanged,
} from "~/@core/lib/websocket/on-expressions-changed";
import { onPostCreated, offPostCreated } from "~/@core/lib/websocket/on-post-created";
import { onPostUpdated, offPostUpdated } from "~/@core/lib/websocket/on-post-updated";
import { onVoiceSound, offVoiceSound } from "~/@core/lib/websocket/on-voice-sound";
import { onVoiceMove, offVoiceMove } from "~/@core/lib/websocket/on-voice-move";
import { onMemberJoined, offMemberJoined } from "~/@core/lib/websocket/on-member-joined";
import { onMemberUpdated, offMemberUpdated } from "~/@core/lib/websocket/on-member-updated";
import { onMemberLeft, offMemberLeft } from "~/@core/lib/websocket/on-member-left";
import { onVoiceJoined, offVoiceJoined } from "~/@core/lib/websocket/on-voice-joined";
import { onVoiceLeft, offVoiceLeft } from "~/@core/lib/websocket/on-voice-left";
import { onVoiceUpdated, offVoiceUpdated } from "~/@core/lib/websocket/on-voice-updated";
import { onSocketError, offSocketError } from "~/@core/lib/websocket/on-socket-error";
import { onFriendUpdated, offFriendUpdated } from "~/@core/lib/websocket/on-friend-updated";
import { onDmCreated, offDmCreated } from "~/@core/lib/websocket/on-dm-created";
import { useTypingStore } from "~/stores/typing-store";
import { useVoiceStore } from "~/stores/voice-store";

type MessagesCache = { pages: MessagePageModel[]; pageParams: unknown[] } | undefined;

/**
 * Ponte entre o socket e o cache do React Query.
 *
 * O cache é a fonte única: os mesmos dados que vieram por HTTP são atualizados
 * pelos eventos, em vez de manter uma store paralela que precisa ser
 * reconciliada. Fica tudo num lugar só porque listener espalhado por componente
 * é a causa clássica de evento duplicado.
 */
const cache = {
  /** Página 0 é a mais nova; mensagem nova entra no fim dela. */
  appendMessage(queryClient: QueryClient, message: PendingMessageModel) {
    queryClient.setQueryData(queryKeys.channel.messages(message.channelId), (old: MessagesCache) => {
      if (!old?.pages.length) return old;

      const [newest, ...rest] = old.pages;
      if (!newest) return old;

      // troca a otimista pela real (mesmo nonce) ou ignora duplicata
      const withoutOptimistic = message.nonce
        ? newest.messages.filter((m) => (m as PendingMessageModel).nonce !== message.nonce)
        : newest.messages;

      if (withoutOptimistic.some((m) => m.id === message.id)) return old;

      return {
        ...old,
        pages: [{ ...newest, messages: [...withoutOptimistic, message] }, ...rest],
      };
    });
  },

  patchMessage(queryClient: QueryClient, channelId: string, messageId: string, patch: Partial<Message>) {
    queryClient.setQueryData(queryKeys.channel.messages(channelId), (old: MessagesCache) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
        })),
      };
    });
  },

  removeMessage(queryClient: QueryClient, channelId: string, messageId: string) {
    queryClient.setQueryData(queryKeys.channel.messages(channelId), (old: MessagesCache) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          messages: page.messages.filter((m) => m.id !== messageId),
        })),
      };
    });
  },

  patchGuild(queryClient: QueryClient, guildId: string, patch: (g: GuildDetailModel) => GuildDetailModel) {
    queryClient.setQueryData(queryKeys.guild.find(guildId), (old: GuildDetailModel | undefined) =>
      old ? patch(old) : old,
    );
  },

  /** Alguns eventos não dizem o servidor; encontramos pelo cache já carregado. */
  patchGuildsWhere(
    queryClient: QueryClient,
    predicate: (g: GuildDetailModel) => boolean,
    patch: (g: GuildDetailModel) => GuildDetailModel,
  ) {
    queryClient
      .getQueriesData<GuildDetailModel>({ queryKey: ["find-guild"] })
      .forEach(([key, data]) => {
        if (data && predicate(data)) queryClient.setQueryData(key, patch(data));
      });
  },
};

export function useRealtime(currentGuildId: string | undefined, currentChannelId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    /**
     * Sempre ligado: o hook só roda dentro de rota autenticada. Antes ele
     * dependia de haver um servidor aberto, e no modo "amigos" (que não tem
     * servidor nenhum) os listeners nunca eram registrados — pedido de amizade
     * e mensagem privada só apareciam depois de recarregar.
     */
    const socketInstance = connectSocket();

    const handleMessageCreated = (message: PendingMessageModel) => {
      cache.appendMessage(queryClient, message);
      cache.patchGuildsWhere(
        queryClient,
        (g) => g.channels.some((c) => c.id === message.channelId),
        (g) => ({
          ...g,
          channels: g.channels.map((c) =>
            c.id === message.channelId ? { ...c, lastMessageId: message.id } : c,
          ),
        }),
      );
      useTypingStore.getState().clear(message.channelId, message.author.id);
    };

    const handlePresence = ({ userId, status }: { userId: string; status: PresenceStatus }) => {
      cache.patchGuildsWhere(
        queryClient,
        (g) => g.members.some((m) => m.user.id === userId),
        (g) => ({
          ...g,
          members: g.members.map((m) =>
            m.user.id === userId ? { ...m, user: { ...m.user, status } } : m,
          ),
        }),
      );
    };

    const upsertVoiceState = (state: VoiceState) =>
      cache.patchGuild(queryClient, state.guildId, (g) => ({
        ...g,
        voiceStates: {
          ...g.voiceStates,
          [state.channelId]: [
            ...(g.voiceStates[state.channelId] ?? []).filter((v) => v.userId !== state.userId),
            state,
          ],
        },
      }));

    const removeVoiceState = ({ channelId, userId }: { channelId: string; userId: string }) =>
      cache.patchGuildsWhere(
        queryClient,
        (g) => Boolean(g.voiceStates[channelId]),
        (g) => ({
          ...g,
          voiceStates: {
            ...g.voiceStates,
            [channelId]: (g.voiceStates[channelId] ?? []).filter((v) => v.userId !== userId),
          },
        }),
      );

    const handleChannelUpsert = (channel: Channel) => {
      if (!channel.guildId) return;

      cache.patchGuild(queryClient, channel.guildId, (g) => ({
        ...g,
        channels: g.channels.some((c) => c.id === channel.id)
          ? g.channels.map((c) => (c.id === channel.id ? { ...c, ...channel } : c))
          : [...g.channels, { ...channel, lastMessageId: null }],
      }));
    };

    onMessageCreated(handleMessageCreated);
    onMessageUpdated((message) => cache.patchMessage(queryClient, message.channelId, message.id, message));
    onMessageDeleted(({ channelId, messageId }) => cache.removeMessage(queryClient, channelId, messageId));
    onMessageReactions(({ channelId, messageId, reactions }) =>
      cache.patchMessage(queryClient, channelId, messageId, {
        // O servidor manda quem reagiu; o "me" é por espectador e resolve aqui.
        reactions: reactions.map((r) => ({
          emoji: r.emoji,
          count: r.userIds.length,
          me: r.userIds.includes(queryClient.getQueryData<{ id: string }>([queryKeys.auth.me])?.id ?? ""),
        })),
      }),
    );
    onTypingStarted(({ channelId, user }) => useTypingStore.getState().add(channelId, user));
    onPresenceChanged(handlePresence);
    onChannelCreated(handleChannelUpsert);
    onChannelUpdated(handleChannelUpsert);
    onChannelDeleted(({ channelId, guildId }) =>
      cache.patchGuild(queryClient, guildId, (g) => ({
        ...g,
        channels: g.channels.filter((c) => c.id !== channelId),
      })),
    );
    onGuildUpdated((guild) => {
      cache.patchGuild(queryClient, guild.id, (g) => ({ ...g, guild: { ...g.guild, ...guild } }));
      void queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    });

    /**
     * Cargos ou permissões de canal mudaram. Aqui não dá pra remendar o cache:
     * o que mudou pode ter tirado (ou dado) canais inteiros pra ESTA pessoa, e
     * só o servidor sabe o resultado. Então recarrega o servidor de verdade.
     */
    onGuildRefresh(({ guildId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.role.find_many(guildId) });
      void queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    });

    onExpressionsChanged(({ guildId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expression.find_many(guildId) });
    });

    onPostCreated((post) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts(post.channelId) });
    });

    onPostUpdated((post) => {
      queryClient.setQueryData(queryKeys.forum.post(post.id), post);
      void queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts(post.channelId) });
    });

    /**
     * Efeito sonoro: o servidor manda o endereço e cada cliente toca. Só quem
     * está na MESMA chamada ouve — e quem está surdo, não.
     */
    onVoiceSound(({ channelId, url, volume }) => {
      const voz = useVoiceStore.getState();
      if (voz.channelId !== channelId || voz.deafened) return;

      const audio = new Audio(url);
      audio.volume = Math.min(1, Math.max(0, volume));
      void audio.play().catch(() => undefined);
    });

    /** Um moderador te moveu (ou te desconectou, quando vem sem canal). */
    onVoiceMove(({ channelId }) => {
      const voz = useVoiceStore.getState();

      if (!channelId) {
        void voz.leave().catch(() => undefined);
        toast.info("Você foi desconectado da chamada.");
        return;
      }

      void voz.join(channelId).catch(() => undefined);
      toast.info("Você foi movido para outro canal de voz.");
    });

    onGuildDeleted(({ guildId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.guild.find(guildId) });
      void queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
      toast.info("Este servidor foi apagado.");
    });

    onMemberJoined((member: GuildMember) =>
      cache.patchGuild(queryClient, member.guildId, (g) => ({
        ...g,
        members: g.members.some((m) => m.id === member.id) ? g.members : [...g.members, member],
      })),
    );
    onMemberUpdated((member: GuildMember) =>
      cache.patchGuild(queryClient, member.guildId, (g) => ({
        ...g,
        members: g.members.map((m) => (m.id === member.id ? member : m)),
      })),
    );
    onMemberLeft(({ guildId, userId }) =>
      cache.patchGuild(queryClient, guildId, (g) => ({
        ...g,
        members: g.members.filter((m) => m.user.id !== userId),
      })),
    );
    onVoiceJoined(upsertVoiceState);
    onVoiceUpdated(upsertVoiceState);
    onVoiceLeft(removeVoiceState);
    onSocketError(({ message }) => toast.error(message));

    onFriendUpdated(() => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.friend.find_many] });
    });

    onDmCreated(() => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.friend.dms] });
    });

    /**
     * Reconectou: as salas do Socket.IO vivem no servidor e somem quando o
     * socket cai, então é preciso reinscrever. E qualquer evento emitido
     * enquanto estávamos fora se perdeu — daí o refetch do servidor, que traz
     * presença e estado de voz do jeito que o servidor os vê agora.
     */
    const handleConnect = () => {
      if (currentChannelId) void joinChannel(currentChannelId).catch(() => undefined);
      if (currentGuildId) {
        void queryClient.refetchQueries({ queryKey: queryKeys.guild.find(currentGuildId) });
      }
    };

    socketInstance.on("connect", handleConnect);

    return () => {
      /**
       * Só remove os listeners; NÃO derruba a conexão. O StrictMode monta o
       * efeito duas vezes em desenvolvimento e desconectar aqui criava um ciclo
       * conecta/desconecta a cada carregamento — janela em que eventos
       * (presença, entrada em canal de voz) se perdiam de vez.
       */
      socketInstance.off("connect", handleConnect);
      offMessageCreated();
      offMessageUpdated();
      offMessageDeleted();
      offMessageReactions();
      offTypingStarted();
      offPresenceChanged();
      offChannelCreated();
      offChannelUpdated();
      offChannelDeleted();
      offGuildUpdated();
      offGuildDeleted();
      offGuildRefresh();
      offExpressionsChanged();
      offPostCreated();
      offPostUpdated();
      offVoiceSound();
      offVoiceMove();
      offMemberJoined();
      offMemberUpdated();
      offMemberLeft();
      offVoiceJoined();
      offVoiceUpdated();
      offVoiceLeft();
      offSocketError();
      offFriendUpdated();
      offDmCreated();
    };
  }, [queryClient, currentGuildId, currentChannelId]);
}

/**
 * Encerra a conexão de verdade — só no logout.
 *
 * `isBooting` é essencial: durante a restauração da sessão o usuário ainda é
 * null, e tratar isso como "deslogou" resetava o estado de voz em TODO
 * carregamento de página — apagando a marca da aba e impedindo o retorno à
 * chamada depois de um reload.
 */
export function useDisconnectOnLogout(isLoggedIn: boolean, isBooting: boolean) {
  useEffect(() => {
    if (isBooting || isLoggedIn) return;

    disconnectSocket();
    useVoiceStore.getState().reset();
  }, [isLoggedIn, isBooting]);
}

export const currentSocket = socket;
