import { useEffect } from "react";
import { lerEmVoz } from "~/lib/ler-em-voz";
import { useNavigate } from "react-router";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type {
  Channel,
  DesiredStatus,
  GuildMember,
  Message,
  PerfilPublico,
  PresenceStatus,
  PublicUser,
  VoiceState,
} from "@gravae/shared";

import { deveTocar } from "~/features/voz/lib/chamada-no-privado";
import { useChamadaStore } from "~/features/voz/stores/chamada-store";
import { tocarSom } from "~/lib/ui-sounds";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import type {
  MessagePageModel,
  PendingMessageModel,
  ReadStateModel,
} from "~/@core/domain/models/message-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import axios from "axios";

import { avisarSessaoPerdida, refreshSession } from "~/@core/lib/api";
import { deveTrocarToken } from "~/features/app/lib/reconexao";
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
import { useSuperReacao } from "~/features/expressao/stores/super-reacao";
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
  onVoiceRecusada,
  offVoiceRecusada,
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
import { avisarDeMensagem } from "~/lib/notificacoes";
import { useIgnoreStore } from "~/stores/ignore-store";
import { useAusencia } from "~/hooks/use-ausencia";
import { useTypingStore } from "~/features/conversa/stores/typing-store";
import { tocarSomDoPainel } from "~/features/voz/lib/soundboard";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useConexaoStore } from "~/features/app/stores/conexao-store";

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

  contarNaoLida(
    queryClient: QueryClient,
    channelId: string,
    guildId: string | null,
    mencionou: boolean,
  ) {
    queryClient.setQueryData(
      [queryKeys.message.read_states],
      (old: ReadStateModel[] | undefined) => {
        const atual = (old ?? []).find((s) => s.channelId === channelId);

        const proximo: ReadStateModel = {
          channelId,
          guildId: atual?.guildId ?? guildId,
          lastReadMessageId: atual?.lastReadMessageId ?? null,
          unreadCount: (atual?.unreadCount ?? 0) + 1,
          mentionCount: (atual?.mentionCount ?? 0) + (mencionou ? 1 : 0),
        };

        return [
          ...(old ?? []).filter((s) => s.channelId !== channelId),
          proximo,
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
  useAusencia(true);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const socketInstance = connectSocket();

    const ondeCaiu = (channelId: string) => {
      const detalhes = queryClient.getQueriesData<GuildDetailModel>({
        queryKey: ["find-guild"],
      });

      for (const [, detalhe] of detalhes) {
        const canal = detalhe?.channels.find((c) => c.id === channelId);
        if (canal && detalhe) return { canal, detalhe };
      }

      return null;
    };

    const avisar = (message: PendingMessageModel) => {
      const eu = queryClient.getQueryData<SelfUserModel>([queryKeys.auth.me]);
      const lugar = ondeCaiu(message.channelId);

      const meusCargos = new Set(
        lugar?.detalhe.members.find((m) => m.user.id === eu?.id)?.roleIds ?? [],
      );

      const meMenciona =
        Boolean(eu) &&
        (message.mentionEveryone ||
          message.mentions.includes(eu?.id ?? "") ||
          message.mentionRoleIds.some((id) => meusCargos.has(id)));

      const lendoAgora =
        currentChannelId === message.channelId &&
        document.visibilityState === "visible" &&
        document.hasFocus();

      if (eu && message.author.id !== eu.id && !lendoAgora) {
        cache.contarNaoLida(
          queryClient,
          message.channelId,
          lugar?.detalhe.guild.id ?? null,
          meMenciona,
        );
      }

      lerEmVoz(message, eu?.id, currentChannelId);

      avisarDeMensagem({
        message,
        meuId: eu?.id,
        canalAberto: currentChannelId,
        meMenciona,
        nomeDoCanal: lugar?.canal.name,
        ehDm: !lugar,
        ignorado: useIgnoreStore.getState().estaIgnorado(message.author.id),
        onAbrir: () =>
          navigate(
            lugar
              ? `/channels/${lugar.detalhe.guild.id}/${message.channelId}`
              : `/dm/${message.channelId}`,
          ),
      });
    };

    const handleMessageCreated = (message: PendingMessageModel) => {
      cache.appendMessage(queryClient, message);
      avisar(message);
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
      perfil,
    }: {
      user: PublicUser;
      perfil: PerfilPublico;
    }) => {
      const temEnfeite = Object.keys(perfil).length > 0;

      cache.patchGuildsWhere(
        queryClient,
        (g) => g.members.some((m) => m.user.id === user.id),
        (g) => {
          const profiles = { ...g.profiles };
          if (temEnfeite) profiles[user.id] = perfil;
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

    const handlePresenceSelf = ({ status }: { status: DesiredStatus }) => {
      const projetado: PresenceStatus =
        status === "INVISIBLE" ? "OFFLINE" : status;

      queryClient.setQueryData([queryKeys.auth.me], (eu?: SelfUserModel) =>
        eu ? { ...eu, desiredStatus: status, status: projetado } : eu,
      );

      const meuId = queryClient.getQueryData<SelfUserModel>([
        queryKeys.auth.me,
      ])?.id;
      if (!meuId) return;

      cache.patchGuildsWhere(
        queryClient,
        (g) => g.members.some((m) => m.user.id === meuId),
        (g) => ({
          ...g,
          members: g.members.map((m) =>
            m.user.id === meuId
              ? { ...m, user: { ...m.user, status: projetado } }
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
    onMessageSuper(({ messageId, emoji, userId: quem }) => {
      const meuId = queryClient.getQueryData<{ id: string }>([
        queryKeys.auth.me,
      ])?.id;
      if (quem === meuId) return;

      const alvo = document.querySelector(`[data-mensagem="${messageId}"]`);
      const caixa = alvo?.getBoundingClientRect();

      useSuperReacao
        .getState()
        .disparar(
          emoji,
          caixa
            ? { x: caixa.left + caixa.width / 2, y: caixa.bottom }
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
        queryKey: queryKeys.comando.find_many(guildId),
      });
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
      const voz = useVoiceStore.getState();
      if (voz.channelId !== channelId || voz.deafened) return;

      if (voz.silenciadosLocais[userId]) return;

      const { somDoPainel, volumeDoPainel, volumeSaida } =
        useVoicePrefs.getState();
      if (!somDoPainel) return;

      const daPessoa = voz.volumesLocais[userId] ?? 1;
      tocarSomDoPainel(
        url,
        volume * daPessoa * volumeDoPainel * volumeSaida,
        userId,
      );
    });

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
    const aoMudarAVozDoTrilho = () =>
      void queryClient.invalidateQueries({ queryKey: [queryKeys.voice.states] });

    const aoEntrarNaVoz = (state: VoiceState) => {
      upsertVoiceState(state);
      aoMudarAVozDoTrilho();

      const meuId = queryClient.getQueryData<SelfUserModel>([
        queryKeys.auth.me,
      ])?.id;
      if (!meuId) return;

      const tocar = deveTocar({
        guildId: state.guildId,
        channelId: state.channelId,
        quemEntrou: state.userId,
        euSou: meuId,
        meuCanalDeVoz: useVoiceStore.getState().channelId,
      });

      if (!tocar) return;

      useChamadaStore.getState().receber({
        channelId: state.channelId,
        userId: state.userId,
        comVideo: state.camera,
      });
    };

    const aoMudarNaVoz = (state: VoiceState) => {
      upsertVoiceState(state);
      aoMudarAVozDoTrilho();
      useChamadaStore.getState().atualizarVideo(state.channelId, state.camera);
    };

    const aoSairDaVoz = (p: { channelId: string; userId: string }) => {
      removeVoiceState(p);
      aoMudarAVozDoTrilho();
      useChamadaStore.getState().encerrar(p.channelId);
    };

    const aoRecusarem = ({
      channelId,
      userId: quemRecusou,
    }: {
      channelId: string;
      userId: string;
    }) => {
      const meuId = queryClient.getQueryData<SelfUserModel>([
        queryKeys.auth.me,
      ])?.id;

      if (!meuId || quemRecusou === meuId) return;
      if (useVoiceStore.getState().channelId !== channelId) return;

      tocarSom("recusada");
      toast.info("A chamada foi recusada.");
      void useVoiceStore.getState().leave();
    };

    onVoiceJoined(aoEntrarNaVoz);
    onVoiceUpdated(aoMudarNaVoz);
    onVoiceLeft(aoSairDaVoz);
    onVoiceRecusada(aoRecusarem);
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
      const caiuAntes = useConexaoStore.getState().jaConectou;
      useConexaoStore.getState().conectou();

      if (currentChannelId)
        void joinChannel(currentChannelId).catch(() => undefined);
      if (currentGuildId) {
        void queryClient.refetchQueries({
          queryKey: queryKeys.guild.find(currentGuildId),
        });
      }

      if (caiuAntes && currentChannelId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.channel.messages(currentChannelId),
        });
      }
    };

    const handleDisconnect = () => useConexaoStore.getState().caiu();

    /*
      O socket manda o access token no aperto de mão e tenta reconectar para
      sempre — mas sempre com o MESMO token. Se ele venceu enquanto a conexão
      estava caída, toda tentativa é recusada e a tela fica em "Reconectando"
      até alguém recarregar na mão. Nada mais renova sozinho: quem renova é o
      interceptador do axios, e ele só roda se houver chamada HTTP.

      Então, ao ser recusado por token, trocamos a cópia da sessão aqui e
      reconectamos — o auth é uma função, e a próxima tentativa já leva o
      token novo.
    */
    let ultimaTroca = 0;

    const handleConnectError = (erro: Error) => {
      useConexaoStore.getState().caiu();

      const agora = Date.now();
      if (!deveTrocarToken(erro.message, agora, ultimaTroca)) return;
      ultimaTroca = agora;

      void refreshSession()
        .then(() => socketInstance.connect())
        .catch((falha) => {
          if (axios.isAxiosError(falha) && falha.response?.status === 401) {
            avisarSessaoPerdida();
          }
        });
    };
    const handleTentativa = (n: number) =>
      useConexaoStore.getState().tentando(n);

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);
    socketInstance.io.on("reconnect_attempt", handleTentativa);

    if (socketInstance.connected) useConexaoStore.getState().conectou();

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
      socketInstance.io.off("reconnect_attempt", handleTentativa);
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
      offVoiceRecusada();
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
