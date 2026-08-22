import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Hash, MessageSquare, MessagesSquare, Users, Volume2 } from "lucide-react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import type { ForumPostModel } from "~/@core/application/requests/forum/forum";
import { ChannelSidebar } from "~/components/ChannelSidebar";
import { Composer } from "~/components/Composer";
import { ForumChannel } from "~/components/ForumChannel";
import { ForumPostView } from "~/components/ForumPostView";
import { PinnedMessagesPanel } from "~/components/PinnedMessagesPanel";
import { VoiceChatPanel } from "~/components/VoiceChatPanel";
import { GuildRail } from "~/components/GuildRail";
import { MemberList } from "~/components/MemberList";
import { MessageList } from "~/components/MessageList";
import { TypingIndicator } from "~/components/TypingIndicator";
import { VoiceStage } from "~/components/VoiceStage";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useSession } from "~/contexts/session-context";
import { usePermissions } from "~/hooks/use-permissions";
import { useRealtime } from "~/hooks/use-realtime";
import { useReconnectVoice } from "~/hooks/use-reconnect-voice";
import { useVoiceStore } from "~/stores/voice-store";
import { cn } from "~/lib/utils";

export const Chat: React.FC = () => {
  const { guildId: routeGuildId, channelId: routeChannelId } = useParams();
  const navigate = useNavigate();

  const { user, endSession, voiceReachable } = useSession();
  const { data: guilds = [], isSuccess: guildsLoaded } = useFindManyGuilds(true);
  const { data: detail } = useFindGuild(routeGuildId);
  const { data: readStates = {} } = useReadStates(true);
  const { data: relacoes = [] } = useFindFriends(true);
  const logout = useLogout();
  const removeMember = useRemoveMember();

  const joinVoice = useVoiceStore((s) => s.join);
  const voiceChannelId = useVoiceStore((s) => s.channelId);
  const [showMembers, setShowMembers] = useState(true);
  /** assunto do fórum aberto, e chat lateral da chamada */
  const [postAberto, setPostAberto] = useState<ForumPostModel | null>(null);
  const [chatDaVoz, setChatDaVoz] = useState<string | null>(null);

  useRealtime(routeGuildId, routeChannelId);

  // Sem servidor na URL, cai no primeiro da lista.
  useEffect(() => {
    if (!routeGuildId && guildsLoaded && guilds[0]) {
      navigate(`/channels/${guilds[0].id}`, { replace: true });
    }
  }, [routeGuildId, guildsLoaded, guilds, navigate]);

  // A URL manda: navegar (ou dar F5) abre o servidor e o canal certos.
  useEffect(() => {
    const channels = detail?.channels ?? [];
    if (!routeGuildId || !channels.length) return;

    const target = channels.find((c) => c.id === routeChannelId) ?? channels.find((c) => c.type === "TEXT");
    if (!target) return;

    if (target.id !== routeChannelId) {
      navigate(`/channels/${routeGuildId}/${target.id}`, { replace: true });
      return;
    }

    if (target.type === "TEXT" || target.type === "FORUM") {
      void joinChannel(target.id).catch(() => undefined);
    }
  }, [routeGuildId, routeChannelId, detail, navigate]);

  // trocar de canal fecha o assunto do fórum que estava aberto
  useEffect(() => setPostAberto(null), [routeChannelId]);

  const channel = detail?.channels.find((c) => c.id === routeChannelId);
  const summary = guilds.find((g) => g.id === routeGuildId);
  const { can, canInChannel } = usePermissions(detail);
  const pedidosPendentes = relacoes.filter((r) => r.status === "PENDING_IN").length;

  /**
   * Onde a CONTA está, segundo o servidor — pode não ser esta aba. Sem
   * distinguir as duas coisas, a barra lateral mostra você na Sala 1 enquanto o
   * resto da tela oferece "Entrar na chamada", e parece contradição.
   */
  const myVoiceState = Object.values(detail?.voiceStates ?? {})
    .flat()
    .find((state) => state.userId === user?.id);

  const accountVoiceChannelId = myVoiceState?.channelId ?? null;

  useReconnectVoice(Boolean(user));

  const inCallHere = voiceChannelId !== null;
  const inCallElsewhere = Boolean(accountVoiceChannelId) && !inCallHere;

  /**
   * Clicar num canal de voz entra na chamada, como no Discord — não é só
   * "abrir a tela". Canal de texto continua sendo navegação normal.
   *
   * Exceção: se a conta já está nessa chamada por outra aba, NÃO entra sozinho.
   * Entrar aqui derrubaria a sessão de mídia da outra aba (mesma identidade no
   * SFU) no meio de uma conversa, sem a pessoa pedir. A tela do canal explica a
   * situação e oferece o botão pra trazer de propósito.
   */
  const selectChannel = (channelId: string) => {
    navigate(`/channels/${routeGuildId}/${channelId}`);

    const target = detail?.channels.find((c) => c.id === channelId);
    if (target?.type !== "VOICE") return;
    if (voiceChannelId === channelId) return;

    const contaJaEstaNesteCanal = (detail?.voiceStates[channelId] ?? []).some(
      (state) => state.userId === user?.id,
    );
    if (contaJaEstaNesteCanal) return;
    // sem CONNECT, clicar no canal só abre a tela com a explicação
    if (!canInChannel(channelId, "CONNECT")) return;
    // sem SFU alcançável, clicar no canal só abre a tela com a explicação
    if (!voiceReachable) return;

    void joinVoice(channelId).catch(() => undefined);
  };

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    endSession();
  };

  if (guildsLoaded && !guilds.length) {
    return (
      <div className="flex h-full">
        <GuildRail
          activeGuildId={null}
          onSelect={(id) => navigate(`/channels/${id}`)}
          onOpenFriends={() => navigate("/dm")}
          pendingFriendRequests={pedidosPendentes}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-surface-2 text-center">
          <h2 className="text-xl font-semibold">Você ainda não tem servidores</h2>
          <p className="max-w-sm text-ink-muted">
            Crie o primeiro no botão <span className="font-semibold text-online">+</span> à esquerda, ou
            entre em um pelo link de convite que alguém te mandar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <GuildRail
        activeGuildId={routeGuildId ?? null}
        onSelect={(id) => navigate(`/channels/${id}`)}
        onOpenFriends={() => navigate("/dm")}
        pendingFriendRequests={pedidosPendentes}
      />

      <ChannelSidebar
        detail={detail}
        summary={summary}
        activeChannelId={routeChannelId}
        readStates={readStates}
        user={user}
        onSelectChannel={selectChannel}
        onLogout={() => void handleLogout()}
        accountVoiceChannelId={inCallElsewhere ? accountVoiceChannelId : null}
        onMoveCallHere={(channelId) => void joinVoice(channelId).catch(() => undefined)}
        onOpenVoiceChat={(id) => setChatDaVoz(id)}
        onLeaveGuild={() => {
          if (!routeGuildId || !user) return;
          removeMember.mutate(
            { guildId: routeGuildId, userId: user.id },
            { onSuccess: () => navigate("/channels", { replace: true }) },
          );
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-4 shadow-sm">
          {channel?.type === "VOICE" ? (
            <Volume2 size={20} className="text-ink-faint" />
          ) : channel?.type === "FORUM" ? (
            <MessagesSquare size={20} className="text-ink-faint" />
          ) : (
            <Hash size={20} className="text-ink-faint" />
          )}
          <h2 className="font-semibold">{channel?.name ?? "…"}</h2>

          {channel?.topic && (
            <>
              <span className="mx-1 h-5 w-px bg-line" />
              <p className="truncate text-sm text-ink-muted">{channel.topic}</p>
            </>
          )}

          <div className="ml-auto flex items-center gap-4">
            {channel && channel.type !== "VOICE" && (
              <PinnedMessagesPanel
                channelId={channel.id}
                canManage={canInChannel(channel.id, "MANAGE_MESSAGES")}
              />
            )}

            {channel?.type === "VOICE" && voiceChannelId === channel.id && (
              <Tooltip label="Abrir chat">
                <button
                  onClick={() => setChatDaVoz(chatDaVoz ? null : channel.id)}
                  aria-label="Abrir chat"
                  className={cn(
                    "transition hover:text-ink",
                    chatDaVoz ? "text-ink" : "text-ink-muted",
                  )}
                >
                  <MessageSquare size={20} />
                </button>
              </Tooltip>
            )}

          <Tooltip label="Membros">
            <button
              onClick={() => setShowMembers((v) => !v)}
              className={`transition hover:text-ink ${showMembers ? "text-ink" : "text-ink-muted"}`}
            >
              <Users size={20} />
            </button>
          </Tooltip>
          </div>
        </header>

        {channel?.type === "VOICE" ? (
          voiceChannelId === channel.id ? (
            <VoiceStage
              channelName={channel.name}
              guildId={detail?.guild.id}
              members={detail?.members}
              roles={detail?.roles}
              canaisDeVoz={detail?.channels.filter((c) => c.type === "VOICE")}
              voiceStates={detail?.voiceStates[channel.id]}
              minhasPermissoes={detail?.permissions}
              currentUserId={user?.id}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Volume2 size={48} className="text-ink-faint" />
              <h3 className="text-lg font-semibold">{channel.name}</h3>

              {!canInChannel(channel.id, "CONNECT") ? (
                <p className="max-w-sm text-sm text-ink-muted">
                  Você não tem permissão para entrar nesta chamada.
                </p>
              ) : !voiceReachable ? (
                <p className="max-w-sm text-sm text-ink-muted">
                  A voz não está disponível neste acesso — o servidor de voz roda só na máquina de
                  quem hospeda. O chat, os anexos e o resto funcionam normalmente.
                </p>
              ) : accountVoiceChannelId === channel.id && inCallElsewhere ? (
                <>
                  <p className="max-w-xs text-sm text-ink-muted">
                    Você já está nesta chamada — só que em outra aba. O áudio está tocando lá.
                  </p>
                  <Button onClick={() => void joinVoice(channel.id).catch(() => undefined)}>
                    Trazer a chamada para esta aba
                  </Button>
                </>
              ) : (
                <Button
                  variant="success"
                  onClick={() => void joinVoice(channel.id).catch(() => undefined)}
                >
                  Entrar na chamada
                </Button>
              )}
            </div>
          )
        ) : channel?.type === "FORUM" ? (
          postAberto ? (
            <ForumPostView
              post={postAberto}
              guildId={channel.guildId ?? ""}
              currentUserId={user?.id}
              isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
              podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
              onVoltar={() => setPostAberto(null)}
            />
          ) : (
            <ForumChannel
              channelId={channel.id}
              channelName={channel.name}
              podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
              onAbrirPost={setPostAberto}
            />
          )
        ) : channel ? (
          <>
            <MessageList
              channelId={channel.id}
              channelName={channel.name}
              guildId={channel.guildId ?? undefined}
              currentUserId={user?.id}
              isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
            />
            <TypingIndicator channelId={channel.id} currentUserId={user?.id} />
            <Composer
              channelId={channel.id}
              channelName={channel.name}
              guildId={channel.guildId ?? undefined}
              podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
              podeAnexar={canInChannel(channel.id, "ATTACH_FILES")}
            />
          </>
        ) : (
          <div className="flex-1" />
        )}
      </main>

      {chatDaVoz && detail && (
        <VoiceChatPanel
          channelId={chatDaVoz}
          channelName={detail.channels.find((c) => c.id === chatDaVoz)?.name ?? ""}
          guildId={detail.guild.id}
          currentUserId={user?.id}
          isModerator={canInChannel(chatDaVoz, "MANAGE_MESSAGES")}
          podeEscrever={canInChannel(chatDaVoz, "SEND_MESSAGES")}
          onClose={() => setChatDaVoz(null)}
        />
      )}

      {showMembers && !chatDaVoz && (
        <MemberList
          members={detail?.members ?? []}
          roles={detail?.roles ?? []}
          ownerId={detail?.guild.ownerId}
          guildId={detail?.guild.id}
          podeModerar={can("MODERATE_MEMBERS")}
        />
      )}
    </div>
  );
};
