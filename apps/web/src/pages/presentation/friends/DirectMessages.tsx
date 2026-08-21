import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { AtSign } from "lucide-react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import { Avatar } from "~/components/Avatar";
import { Composer } from "~/components/Composer";
import { DmSidebar } from "~/components/DmSidebar";
import { GuildRail } from "~/components/GuildRail";
import { MessageList } from "~/components/MessageList";
import { TypingIndicator } from "~/components/TypingIndicator";
import { useSession } from "~/contexts/session-context";
import { useRealtime } from "~/hooks/use-realtime";
import { Friends } from "~/pages/presentation/friends/Friends";

/**
 * O "modo amigos": fora de qualquer servidor. Mostra a lista de amigos ou uma
 * conversa privada, dependendo da URL.
 */
export const DirectMessages: React.FC = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();

  const { user, endSession } = useSession();
  const { data: dms = [] } = useFindDms(true);
  const { data: relacoes = [] } = useFindFriends(true);
  const { data: readStates = {} } = useReadStates(true);
  const openDm = useOpenDm();
  const logout = useLogout();

  useRealtime(undefined, channelId);

  // Inscrição na conversa: é o que faz a mensagem do outro chegar sem refresh.
  useEffect(() => {
    if (channelId) void joinChannel(channelId).catch(() => undefined);
  }, [channelId]);

  const conversa = dms.find((dm) => dm.id === channelId);
  const pendentes = relacoes.filter((r) => r.status === "PENDING_IN").length;

  const abrirConversa = async (userId: string) => {
    const canal = await openDm.mutateAsync(userId).catch(() => null);
    if (canal) navigate(`/dm/${canal.id}`);
  };

  const sair = async () => {
    await logout.mutateAsync().catch(() => undefined);
    endSession();
  };

  if (!user) return null;

  return (
    <div className="flex h-full">
      <GuildRail
        activeGuildId={null}
        onSelect={(id) => navigate(`/channels/${id}`)}
        onOpenFriends={() => navigate("/dm")}
        pendingFriendRequests={pendentes}
      />

      <DmSidebar
        activeChannelId={channelId}
        readStates={readStates}
        user={user}
        onOpenFriends={() => navigate("/dm")}
        onSelectDm={(id) => navigate(`/dm/${id}`)}
        onLogout={() => void sair()}
      />

      {conversa ? (
        <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-4 shadow-sm">
            <AtSign size={20} className="text-ink-faint" />
            <h2 className="font-semibold">{conversa.user.displayName}</h2>
            <span className="text-sm text-ink-faint">@{conversa.user.username}</span>
          </header>

          <MessageList
            channelId={conversa.id}
            channelName={conversa.user.displayName}
            currentUserId={user.id}
            isModerator={false}
            header={
              <div className="px-4 pb-6 pt-4">
                <Avatar
                  id={conversa.user.id}
                  name={conversa.user.displayName}
                  url={conversa.user.avatarUrl}
                  size={80}
                />
                <h2 className="mt-3 text-2xl font-bold">{conversa.user.displayName}</h2>
                <p className="mt-1 text-ink-muted">
                  Este é o começo da sua conversa com {conversa.user.displayName}.
                </p>
              </div>
            }
          />

          <TypingIndicator channelId={conversa.id} currentUserId={user.id} />
          <Composer channelId={conversa.id} channelName={conversa.user.displayName} />
        </main>
      ) : (
        <Friends onOpenConversation={(userId) => void abrirConversa(userId)} />
      )}
    </div>
  );
};
