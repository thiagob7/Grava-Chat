import { useEffect } from "react";
import { readVoice } from "~/lib/ler-em-voz";
import { useNavigate } from "react-router";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type {
  Channel,
  DesiredStatus,
  GuildMember,
  Message,
  ProfilePublic,
  PresenceStatus,
  PublicUser,
  VoiceState,
} from "@gravae/shared";

import { mustPlay } from "~/features/voz/lib/chamada-no-privado";
import { useCallStore } from "~/features/voz/stores/chamada-store";
import { playSound } from "~/lib/ui-sounds";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import type {
  MessagePageModel,
  PendingMessageModel,
  ReadStateModel,
} from "~/@core/domain/models/message-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import axios from "axios";

import { notifySessionLost, refreshSession } from "~/@core/lib/api";
import { mustSwapToken } from "~/features/app/lib/reconexao";
import { connectSocket, disconnectSocket, socket } from "~/@core/lib/websocket";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import {
  onMessageCreated,
  offMessageCreated,
} from "~/@core/lib/websocket/on-message-created";
import {
  onMessageUpdated,
  offMessageUpdated,
} from "~/@core/lib/websocket/on-message-updated";
import {
  onMessageDeleted,
  offMessageDeleted,
} from "~/@core/lib/websocket/on-message-deleted";
import {
  onMessageReactions,
  offMessageReactions,
} from "~/@core/lib/websocket/on-message-reactions";
import {
  onMessageSuper,
  offMessageSuper,
} from "~/@core/lib/websocket/on-message-super";
import { useSuperReaction } from "~/features/expressao/stores/super-reacao";
import {
  onTypingStarted,
  offTypingStarted,
} from "~/@core/lib/websocket/on-typing-started";
import {
  onPresenceChanged,
  offPresenceChanged,
} from "~/@core/lib/websocket/on-presence-changed";
import {
  onPresenceSelf,
  offPresenceSelf,
} from "~/@core/lib/websocket/on-presence-self";
import {
  onChannelCreated,
  offChannelCreated,
} from "~/@core/lib/websocket/on-channel-created";
import {
  onChannelUpdated,
  offChannelUpdated,
} from "~/@core/lib/websocket/on-channel-updated";
import {
  onChannelDeleted,
  offChannelDeleted,
} from "~/@core/lib/websocket/on-channel-deleted";
import {
  onGuildUpdated,
  offGuildUpdated,
} from "~/@core/lib/websocket/on-guild-updated";
import {
  onGuildDeleted,
  offGuildDeleted,
} from "~/@core/lib/websocket/on-guild-deleted";
import {
  onGuildRefresh,
  offGuildRefresh,
} from "~/@core/lib/websocket/on-guild-refresh";
import {
  onCommandsChanged,
  offCommandsChanged,
} from "~/@core/lib/websocket/on-commands-changed";
import {
  onExpressionsChanged,
  offExpressionsChanged,
} from "~/@core/lib/websocket/on-expressions-changed";
import {
  onEventUpdated,
  offEventUpdated,
} from "~/@core/lib/websocket/on-event-updated";
import {
  onPostCreated,
  offPostCreated,
} from "~/@core/lib/websocket/on-post-created";
import {
  onPostUpdated,
  offPostUpdated,
} from "~/@core/lib/websocket/on-post-updated";
import {
  onVoiceSound,
  offVoiceSound,
} from "~/@core/lib/websocket/on-voice-sound";
import { onVoiceMove, offVoiceMove } from "~/@core/lib/websocket/on-voice-move";
import {
  onMemberJoined,
  offMemberJoined,
} from "~/@core/lib/websocket/on-member-joined";
import {
  onMemberUpdated,
  offMemberUpdated,
} from "~/@core/lib/websocket/on-member-updated";
import {
  onMemberLeft,
  offMemberLeft,
} from "~/@core/lib/websocket/on-member-left";
import {
  onVoiceJoined,
  offVoiceJoined,
} from "~/@core/lib/websocket/on-voice-joined";
import {
  onVoiceRefused,
  offVoiceRefused,
} from "~/@core/lib/websocket/on-voice-recusada";
import { onVoiceLeft, offVoiceLeft } from "~/@core/lib/websocket/on-voice-left";
import {
  onVoiceUpdated,
  offVoiceUpdated,
} from "~/@core/lib/websocket/on-voice-updated";
import {
  onSocketError,
  offSocketError,
} from "~/@core/lib/websocket/on-socket-error";
import {
  onUserUpdated,
  offUserUpdated,
} from "~/@core/lib/websocket/on-user-updated";
import {
  onFriendUpdated,
  offFriendUpdated,
} from "~/@core/lib/websocket/on-friend-updated";
import { onDmCreated, offDmCreated } from "~/@core/lib/websocket/on-dm-created";
import { notifyMessage } from "~/lib/notificacoes";
import { useIgnoreStore } from "~/stores/ignore-store";
import { useAbsence } from "~/hooks/use-ausencia";
import { useTypingStore } from "~/features/conversa/stores/typing-store";
import { playPanelSound } from "~/features/voz/lib/soundboard";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useConnectionStore } from "~/features/app/stores/conexao-store";

type MessagesCache =
  { pages: MessagePageModel[]; pageParams: unknown[] } | undefined;

const cache = {
  appendMessage(queryClient: QueryClient, message: PendingMessageModel) {
    queryClient.setQueryData(
      queryKeys.channel.messages(message.channelId),
      (old: MessagesCache) => {
        if (!old?.pages.length) return old;

        const [newest, ...rest] = old.pages;
        if (!newest) return old;

        const withoutOptimistic = message.nonce
          ? newest.messages.filter(
              (m) => (m as PendingMessageModel).nonce !== message.nonce,
            )
          : newest.messages;

        if (withoutOptimistic.some((m) => m.id === message.id)) return old;

        return {
          ...old,
          pages: [
            { ...newest, messages: [...withoutOptimistic, message] },
            ...rest,
          ],
        };
      },
    );
  },

  patchMessage(
    queryClient: QueryClient,
    channelId: string,
    messageId: string,
    patch: Partial<Message>,
  ) {
    queryClient.setQueryData(
      queryKeys.channel.messages(channelId),
      (old: MessagesCache) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id === messageId ? { ...m, ...patch } : m,
            ),
          })),
        };
      },
    );
  },

  removeMessage(
    queryClient: QueryClient,
    channelId: string,
    messageId: string,
  ) {
    queryClient.setQueryData(
      queryKeys.channel.messages(channelId),
      (old: MessagesCache) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((m) => m.id !== messageId),
          })),
        };
      },
    );
  },

  countNotRead(
    queryClient: QueryClient,
    channelId: string,
    guildId: string | null,
    mentioned: boolean,
  ) {
    queryClient.setQueryData(
      [queryKeys.message.read_states],
      (old: ReadStateModel[] | undefined) => {
        const current = (old ?? []).find((s) => s.channelId === channelId);

        const next: ReadStateModel = {
          channelId,
          guildId: current?.guildId ?? guildId,
          lastReadMessageId: current?.lastReadMessageId ?? null,
          unreadCount: (current?.unreadCount ?? 0) + 1,
          mentionCount: (current?.mentionCount ?? 0) + (mentioned ? 1 : 0),
        };

        return [
          ...(old ?? []).filter((s) => s.channelId !== channelId),
          next,
        ];
      },
    );
  },

  patchGuild(
    queryClient: QueryClient,
    guildId: string,
    patch: (g: GuildDetailModel) => GuildDetailModel,
  ) {
    queryClient.setQueryData(
      queryKeys.guild.find(guildId),
      (old: GuildDetailModel | undefined) => (old ? patch(old) : old),
    );
  },

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

export function useRealtime(
  currentGuildId: string | undefined,
  currentChannelId: string | undefined,
) {
  useAbsence(true);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const socketInstance = connectSocket();

    const whereDropped = (channelId: string) => {
      const details = queryClient.getQueriesData<GuildDetailModel>({
        queryKey: ["find-guild"],
      });

      for (const [, detail] of details) {
        const channel = detail?.channels.find((c) => c.id === channelId);
        if (channel && detail) return { channel, detail };
      }

      return null;
    };

    const notify = (message: PendingMessageModel) => {
      const eu = queryClient.getQueryData<SelfUserModel>([queryKeys.auth.me]);
      const place = whereDropped(message.channelId);

      const mineRoles = new Set(
        place?.detail.members.find((m) => m.user.id === eu?.id)?.roleIds ?? [],
      );

      const mention = {
        direct: Boolean(eu) && message.mentions.includes(eu?.id ?? ""),
        everyone: Boolean(eu) && Boolean(message.mentionEveryone),
        role: Boolean(eu) && message.mentionRoleIds.some((id) => mineRoles.has(id)),
      };

      const meMentions = mention.direct || mention.everyone || mention.role;

      const readingNow =
        currentChannelId === message.channelId &&
        document.visibilityState === "visible" &&
        document.hasFocus();

      if (eu && message.author.id !== eu.id && !readingNow) {
        cache.countNotRead(
          queryClient,
          message.channelId,
          place?.detail.guild.id ?? null,
          meMentions,
        );
      }

      readVoice(message, eu?.id, currentChannelId);

      notifyMessage({
        message,
        myId: eu?.id,
        channelIsOpen: currentChannelId,
        mention,
        channelName: place?.channel.name,
        isDm: !place,
        guildId: place?.detail.guild.id ?? null,
        ignored: useIgnoreStore.getState().thisIgnored(message.author.id),
        onOpen: () =>
          navigate(
            place
              ? `/channels/${place.detail.guild.id}/${message.channelId}`
              : `/dm/${message.channelId}`,
          ),
      });
    };

    const handleMessageCreated = (message: PendingMessageModel) => {
      cache.appendMessage(queryClient, message);
      notify(message);
      cache.patchGuildsWhere(
        queryClient,
        (g) => g.channels.some((c) => c.id === message.channelId),
        (g) => ({
          ...g,
          channels: g.channels.map((c) =>
            c.id === message.channelId
              ? { ...c, lastMessageId: message.id }
              : c,
          ),
        }),
      );
      useTypingStore.getState().clear(message.channelId, message.author.id);
    };

    const handlePresence = ({
      userId,
      status,
    }: {
      userId: string;
      status: PresenceStatus;
    }) => {
      if (
        userId ===
        queryClient.getQueryData<SelfUserModel>([queryKeys.auth.me])?.id
      )
        return;

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

    const handleUserUpdated = ({
      user,
      profile,
    }: {
      user: PublicUser;
      profile: ProfilePublic;
    }) => {
      const hasCharm = Object.keys(profile).length > 0;

      cache.patchGuildsWhere(
        queryClient,
        (g) => g.members.some((m) => m.user.id === user.id),
        (g) => {
          const profiles = { ...g.profiles };
          if (hasCharm) profiles[user.id] = profile;
          else delete profiles[user.id];

          return {
            ...g,
            profiles,
            members: g.members.map((m) =>
              m.user.id === user.id
                ? { ...m, user: { ...user, status: m.user.status } }
                : m,
            ),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(user.id),
      });
    };

    const handlePresenceSelf = ({
      status,
      projected,
    }: {
      status: DesiredStatus;
      projected: PresenceStatus;
    }) => {

      queryClient.setQueryData([queryKeys.auth.me], (eu?: SelfUserModel) =>
        eu ? { ...eu, desiredStatus: status, status: projected } : eu,
      );

      const myId = queryClient.getQueryData<SelfUserModel>([
        queryKeys.auth.me,
      ])?.id;
      if (!myId) return;

      cache.patchGuildsWhere(
        queryClient,
        (g) => g.members.some((m) => m.user.id === myId),
        (g) => ({
          ...g,
          members: g.members.map((m) =>
            m.user.id === myId
              ? { ...m, user: { ...m.user, status: projected } }
              : m,
          ),
        }),
      );
    };

    const upsertVoiceState = (state: VoiceState) =>
      state.guildId === null
        ? undefined
        : cache.patchGuild(queryClient, state.guildId, (g) => ({
            ...g,
            voiceStates: {
              ...g.voiceStates,
              [state.channelId]: [
                ...(g.voiceStates[state.channelId] ?? []).filter(
                  (v) => v.userId !== state.userId,
                ),
                state,
              ],
            },
          }));

    const removeVoiceState = ({
      channelId,
      userId,
    }: {
      channelId: string;
      userId: string;
    }) =>
      cache.patchGuildsWhere(
        queryClient,
        (g) => Boolean(g.voiceStates[channelId]),
        (g) => ({
          ...g,
          voiceStates: {
            ...g.voiceStates,
            [channelId]: (g.voiceStates[channelId] ?? []).filter(
              (v) => v.userId !== userId,
            ),
          },
        }),
      );

    const handleChannelUpsert = (channel: Channel) => {
      if (!channel.guildId) return;

      cache.patchGuild(queryClient, channel.guildId, (g) => ({
        ...g,
        channels: g.channels.some((c) => c.id === channel.id)
          ? g.channels.map((c) =>
              c.id === channel.id ? { ...c, ...channel } : c,
            )
          : [...g.channels, { ...channel, lastMessageId: null }],
      }));
    };

    onMessageCreated(handleMessageCreated);
    onMessageUpdated((message) =>
      cache.patchMessage(queryClient, message.channelId, message.id, message),
    );
    onMessageDeleted(({ channelId, messageId }) =>
      cache.removeMessage(queryClient, channelId, messageId),
    );
    onMessageReactions(({ channelId, messageId, reactions }) =>
      cache.patchMessage(queryClient, channelId, messageId, {
        reactions: reactions.map((r) => ({
          emoji: r.emoji,
          count: r.userIds.length,
          me: r.userIds.includes(
            queryClient.getQueryData<{ id: string }>([queryKeys.auth.me])?.id ??
              "",
          ),
          burst: r.burst,
        })),
      }),
    );
    onMessageSuper(({ messageId, emoji, userId: who }) => {
      const myId = queryClient.getQueryData<{ id: string }>([
        queryKeys.auth.me,
      ])?.id;
      if (who === myId) return;

      const target = document.querySelector(`[data-mensagem="${messageId}"]`);
      const box = target?.getBoundingClientRect();

      useSuperReaction
        .getState()
        .fire(
          emoji,
          box
            ? { x: box.left + box.width / 2, y: box.bottom }
            : undefined,
        );
    });

    onTypingStarted(({ channelId, user }) =>
      useTypingStore.getState().add(channelId, user),
    );
    onPresenceChanged(handlePresence);
    onPresenceSelf(handlePresenceSelf);
    onChannelCreated(handleChannelUpsert);
    onChannelUpdated(handleChannelUpsert);
    onChannelDeleted(({ channelId, guildId }) =>
      cache.patchGuild(queryClient, guildId, (g) => ({
        ...g,
        channels: g.channels.filter((c) => c.id !== channelId),
      })),
    );
    onGuildUpdated((guild) => {
      cache.patchGuild(queryClient, guild.id, (g) => ({
        ...g,
        guild: { ...g.guild, ...guild },
      }));
      void queryClient.invalidateQueries({
        queryKey: [queryKeys.guild.find_many],
      });
    });

    onGuildRefresh(({ guildId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.guild.find(guildId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.role.find_many(guildId),
      });
      void queryClient.invalidateQueries({
        queryKey: [queryKeys.guild.find_many],
      });
    });

    onExpressionsChanged(({ guildId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.expression.find_many(guildId),
      });
    });

    onCommandsChanged(({ guildId }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.command.find_many(guildId),
      });
    });

    onEventUpdated(({ guildId }) => {
      void queryClient.invalidateQueries({ queryKey: ["events", guildId] });
    });

    onPostCreated((post) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.forum.posts(post.channelId),
      });
    });

    onPostUpdated((post) => {
      queryClient.setQueryData(queryKeys.forum.post(post.id), post);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.forum.posts(post.channelId),
      });
    });

    onVoiceSound(({ channelId, userId, url, volume }) => {
      const voice = useVoiceStore.getState();
      if (voice.channelId !== channelId || voice.deafened) return;

      if (voice.mutedLocal[userId]) return;

      const { panelSound, panelVolume, volumeOutput } =
        useVoicePrefs.getState();
      if (!panelSound) return;

      const fromPerson = voice.volumesLocal[userId] ?? 1;
      playPanelSound(
        url,
        volume * fromPerson * panelVolume * volumeOutput,
        userId,
      );
    });

    onVoiceMove(({ channelId }) => {
      const voice = useVoiceStore.getState();

      if (!channelId) {
        void voice.leave().catch(() => undefined);
        toast.info("Você foi desconectado da chamada.");
        return;
      }

      void voice.join(channelId).catch(() => undefined);
      toast.info("Você foi movido para outro canal de voz.");
    });

    onGuildDeleted(({ guildId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.guild.find(guildId) });
      void queryClient.invalidateQueries({
        queryKey: [queryKeys.guild.find_many],
      });
      toast.info("Este servidor foi apagado.");
    });

    onMemberJoined((member: GuildMember) =>
      cache.patchGuild(queryClient, member.guildId, (g) => ({
        ...g,
        members: g.members.some((m) => m.id === member.id)
          ? g.members
          : [...g.members, member],
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
    onUserUpdated(handleUserUpdated);
    const onRailChangeVoice = () =>
      void queryClient.invalidateQueries({ queryKey: [queryKeys.voice.states] });

    const onJoinVoice = (state: VoiceState) => {
      upsertVoiceState(state);
      onRailChangeVoice();

      const myId = queryClient.getQueryData<SelfUserModel>([
        queryKeys.auth.me,
      ])?.id;
      if (!myId) return;

      const play = mustPlay({
        guildId: state.guildId,
        channelId: state.channelId,
        whoJoined: state.userId,
        euAm: myId,
        voiceMyChannel: useVoiceStore.getState().channelId,
      });

      if (!play) return;

      useCallStore.getState().receive({
        channelId: state.channelId,
        userId: state.userId,
        withVideo: state.camera,
      });
    };

    const onChangeVoice = (state: VoiceState) => {
      upsertVoiceState(state);
      onRailChangeVoice();
      useCallStore.getState().updateVideo(state.channelId, state.camera);
    };

    const onLeaveVoice = (p: { channelId: string; userId: string }) => {
      removeVoiceState(p);
      onRailChangeVoice();
      useCallStore.getState().end(p.channelId);
    };

    const onRefuse = ({
      channelId,
      userId: whoRefused,
    }: {
      channelId: string;
      userId: string;
    }) => {
      const myId = queryClient.getQueryData<SelfUserModel>([
        queryKeys.auth.me,
      ])?.id;

      if (!myId || whoRefused === myId) return;
      if (useVoiceStore.getState().channelId !== channelId) return;

      playSound("refused");
      toast.info("A chamada foi recusada.");
      void useVoiceStore.getState().leave();
    };

    onVoiceJoined(onJoinVoice);
    onVoiceUpdated(onChangeVoice);
    onVoiceLeft(onLeaveVoice);
    onVoiceRefused(onRefuse);
    onSocketError(({ message }) => toast.error(message, { toastId: message }));

    onFriendUpdated(() => {
      void queryClient.invalidateQueries({
        queryKey: [queryKeys.friend.find_many],
      });
    });

    onDmCreated(() => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.friend.dms] });
    });

    const handleConnect = () => {
      const droppedBefore = useConnectionStore.getState().alreadyConnected;
      useConnectionStore.getState().didConnect();

      if (currentChannelId)
        void joinChannel(currentChannelId).catch(() => undefined);
      if (currentGuildId) {
        void queryClient.refetchQueries({
          queryKey: queryKeys.guild.find(currentGuildId),
        });
      }

      if (droppedBefore && currentChannelId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.channel.messages(currentChannelId),
        });
      }
    };

    const handleDisconnect = () => useConnectionStore.getState().dropped();

    let lastSwap = 0;

    const handleConnectError = (error: Error) => {
      useConnectionStore.getState().dropped();

      const now = Date.now();
      if (!mustSwapToken(error.message, now, lastSwap)) return;
      lastSwap = now;

      void refreshSession()
        .then(() => socketInstance.connect())
        .catch((failure) => {
          if (axios.isAxiosError(failure) && failure.response?.status === 401) {
            notifySessionLost();
          }
        });
    };
    const handleAttempt = (n: number) =>
      useConnectionStore.getState().trying(n);

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.io.on("reconnect_attempt", handleAttempt);

    if (socketInstance.connected) useConnectionStore.getState().didConnect();

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
      socketInstance.io.off("reconnect_attempt", handleAttempt);
      offMessageCreated();
      offMessageUpdated();
      offMessageDeleted();
      offMessageReactions();
      offMessageSuper();
      offTypingStarted();
      offPresenceChanged();
      offChannelCreated();
      offChannelUpdated();
      offChannelDeleted();
      offGuildUpdated();
      offGuildDeleted();
      offGuildRefresh();
      offCommandsChanged();
      offExpressionsChanged();
      offEventUpdated();
      offPostCreated();
      offPostUpdated();
      offVoiceSound();
      offVoiceMove();
      offMemberJoined();
      offMemberUpdated();
      offMemberLeft();
      offUserUpdated();
      offPresenceSelf();
      offVoiceJoined();
      offVoiceUpdated();
      offVoiceLeft();
      offVoiceRefused();
      offSocketError();
      offFriendUpdated();
      offDmCreated();
    };
  }, [queryClient, navigate, currentGuildId, currentChannelId]);
}

export function useDisconnectOnLogout(isLoggedIn: boolean, isBooting: boolean) {
  useEffect(() => {
    if (isBooting || isLoggedIn) return;

    disconnectSocket();
    useVoiceStore.getState().reset();
  }, [isLoggedIn, isBooting]);
}

export const currentSocket = socket;
