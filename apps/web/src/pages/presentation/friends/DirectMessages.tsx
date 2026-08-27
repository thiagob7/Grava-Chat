import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AtSign, Menu } from "lucide-react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import { Avatar } from "~/components/Avatar";
import { AreaDeConversa, RodapeDaConversa } from "~/components/AreaDeConversa";
import { Composer } from "~/components/Composer";
import { AtivosAgora } from "~/components/AtivosAgora";
import { DmSidebar } from "~/components/DmSidebar";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { useTelaEstreita } from "~/hooks/use-tela-estreita";
import { GuildRail } from "~/components/GuildRail";
import { MessageList } from "~/components/MessageList";
import { TypingIndicator } from "~/components/TypingIndicator";
import { useSession } from "~/contexts/session-context";
import { useRealtime } from "~/hooks/use-realtime";
import { Friends } from "~/pages/presentation/friends/Friends";

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

  const telaEstreita = useTelaEstreita();
  const [menuAberto, setMenuAberto] = useState(false);

  if (!user) return null;

  const navegacao = (
    <>
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
        onSelectDm={(id) => {
          navigate(`/dm/${id}`);
          setMenuAberto(false);
        }}
        onLogout={() => void sair()}
      />
    </>
  );

  return (
    <div className="flex h-full">
      {/* Mesma navegação nos dois tamanhos: no fluxo em telas largas, dentro de
          uma gaveta no celular. Ver o comentário equivalente em Chat.tsx. */}
      {telaEstreita ? (
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetContent className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0 data-[state=open]:slide-in-from-left">
            <SheetTitle className="sr-only">Conversas</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      {conversa ? (
        <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4 shadow-sm">
            {telaEstreita && (
              <button
                onClick={() => setMenuAberto(true)}
                aria-label="Abrir conversas"
                className="-ml-1 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
              >
                <Menu size={20} />
              </button>
            )}
            <AtSign size={20} className="text-ink-faint" />
            <h2 className="font-semibold">{conversa.user.displayName}</h2>
            <span className="text-sm text-ink-faint">@{conversa.user.username}</span>
          </header>

          <AreaDeConversa>
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

          <RodapeDaConversa>
            <TypingIndicator channelId={conversa.id} currentUserId={user.id} />
            <Composer channelId={conversa.id} channelName={conversa.user.displayName} />
          </RodapeDaConversa>
          </AreaDeConversa>
        </main>
      ) : (
        <>
          <Friends onOpenConversation={(userId) => void abrirConversa(userId)} />
          <AtivosAgora />
        </>
      )}
    </div>
  );
};
