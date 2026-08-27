import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Hash, Menu, MessageSquare, MessagesSquare, Users, Volume2 } from "lucide-react";

import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { useRemoveMember } from "~/@core/application/queries/guild/use-remove-member";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { useTelaEstreita } from "~/hooks/use-tela-estreita";
import type { ForumPostModel } from "~/@core/application/requests/forum/forum";
import { AreaDeConversa, RodapeDaConversa } from "~/components/AreaDeConversa";
import { CampoDeBusca } from "~/components/CampoDeBusca";
import { ChannelSidebar } from "~/components/ChannelSidebar";
import { Composer } from "~/components/Composer";
import { ForumChannel } from "~/components/ForumChannel";
import { ForumPostView } from "~/components/ForumPostView";
import { PinnedMessagesPanel } from "~/components/PinnedMessagesPanel";
import { FavoritasPanel } from "~/components/FavoritasPanel";
import { VoiceChatPanel } from "~/components/VoiceChatPanel";
import { GuildRail } from "~/components/GuildRail";
import { MemberList } from "~/components/MemberList";
import { MessageList } from "~/components/MessageList";
import { ModeratorView } from "~/components/ModeratorView";
import { PainelDeBusca } from "~/components/PainelDeBusca";
import { TypingIndicator } from "~/components/TypingIndicator";
import { VoiceStage } from "~/components/VoiceStage";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useSession } from "~/contexts/session-context";
import { usePermissions } from "~/hooks/use-permissions";
import { useRealtime } from "~/hooks/use-realtime";
import { useReconnectVoice } from "~/hooks/use-reconnect-voice";
import { useModeracao } from "~/stores/moderacao";
import { useVoiceStore } from "~/stores/voice-store";
import { familiaDaFonte } from "~/lib/cosmeticos/fontes";
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
  const [postAberto, setPostAberto] = useState<ForumPostModel | null>(null);
  /*
    O chat da chamada mora DENTRO do canal de voz, como no Discord.

    Antes ele era um painel solto: dava para estar lendo #musica-play com o
    chat do "Tecnologia" aberto do lado, dois canais na tela ao mesmo tempo,
    e nada dizia a qual deles a caixa de escrever pertencia. Agora é um
    liga/desliga do canal de voz que está aberto — some sozinho quando você
    sai dele.
  */
  const [chatDaVozAberto, setChatDaVozAberto] = useState(false);
  /// termo que está valendo; vazio fecha o painel de resultados
  const [busca, setBusca] = useState("");

  useRealtime(routeGuildId, routeChannelId);

  useEffect(() => {
    if (!routeGuildId && guildsLoaded && guilds[0]) {
      navigate(`/channels/${guilds[0].id}`, { replace: true });
    }
  }, [routeGuildId, guildsLoaded, guilds, navigate]);

  useEffect(() => {
    const channels = detail?.channels ?? [];
    if (!routeGuildId || !channels.length) return;

    const target = channels.find((c) => c.id === routeChannelId) ?? channels.find((c) => c.type === "TEXT");
    if (!target) return;

    if (target.id !== routeChannelId) {
      navigate(`/channels/${routeGuildId}/${target.id}`, { replace: true });
      return;
    }

    /*
      A voz entra na mesma lista: o canal tem chat, e sem o `join` no gateway
      as mensagens novas dele não chegavam enquanto o painel estava aberto.
    */
    if (target.type === "TEXT" || target.type === "FORUM" || target.type === "VOICE") {
      void joinChannel(target.id).catch(() => undefined);
    }
  }, [routeGuildId, routeChannelId, detail, navigate]);

  useEffect(() => setPostAberto(null), [routeChannelId]);
  /// Resultado é de um servidor só; ao trocar, o painel some em vez de mostrar
  /// mensagens de um lugar onde você não está mais.
  useEffect(() => setBusca(""), [routeGuildId]);
  /// A ficha é de alguém DESTE servidor; trocando de casa, ela fecha.
  useEffect(() => useModeracao.getState().fechar(), [routeGuildId]);

  const channel = detail?.channels.find((c) => c.id === routeChannelId);
  /// Aberto E num canal de voz: mudar para um canal de texto guarda a escolha
  /// sem mostrar o painel, e voltar para a voz o traz de volta.
  const chatDaVozVisivel = chatDaVozAberto && channel?.type === "VOICE";
  const summary = guilds.find((g) => g.id === routeGuildId);
  const { can, canInChannel } = usePermissions(detail);
  const pedidosPendentes = relacoes.filter((r) => r.status === "PENDING_IN").length;

  const myVoiceState = Object.values(detail?.voiceStates ?? {})
    .flat()
    .find((state) => state.userId === user?.id);

  const accountVoiceChannelId = myVoiceState?.channelId ?? null;

  useReconnectVoice(Boolean(user));

  const inCallHere = voiceChannelId !== null;
  const inCallElsewhere = Boolean(accountVoiceChannelId) && !inCallHere;

  const selectChannel = (channelId: string) => {
    navigate(`/channels/${routeGuildId}/${channelId}`);

    const target = detail?.channels.find((c) => c.id === channelId);
    if (target?.type !== "VOICE") return;
    if (voiceChannelId === channelId) return;

    const contaJaEstaNesteCanal = (detail?.voiceStates[channelId] ?? []).some(
      (state) => state.userId === user?.id,
    );
    if (contaJaEstaNesteCanal) return;
    if (!canInChannel(channelId, "CONNECT")) return;
    if (!voiceReachable) return;

    void joinVoice(channelId).catch(() => undefined);
  };

  const telaEstreita = useTelaEstreita();
  const [menuAberto, setMenuAberto] = useState(false);

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

  /*
    As mesmas duas colunas servem os dois tamanhos de tela. No desktop elas
    ficam no fluxo; no celular, dentro de uma gaveta — e por isso viram uma
    variável em vez de JSX repetido: duplicar essa lista de props seria garantir
    que uma das cópias ficasse pra trás na próxima mudança.
  */
  const navegacao = (
    <>
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
          onSelectChannel={(id) => {
          selectChannel(id);
          setMenuAberto(false);
        }}
          onLogout={() => void handleLogout()}
          accountVoiceChannelId={inCallElsewhere ? accountVoiceChannelId : null}
          onMoveCallHere={(channelId) => void joinVoice(channelId).catch(() => undefined)}
          /*
            O ícone de chat abre o canal de voz e o chat dele — sem entrar na
            chamada. Por isso `navigate` direto, e não o `selectChannel`, que
            conecta o microfone ao chegar num canal de voz.
          */
          onOpenVoiceChat={(id) => {
            navigate(`/channels/${routeGuildId}/${id}`);
            setChatDaVozAberto(true);
          }}
          onLeaveGuild={() => {
            if (!routeGuildId || !user) return;
            removeMember.mutate(
              { guildId: routeGuildId, userId: user.id },
              { onSuccess: () => navigate("/channels", { replace: true }) },
            );
          }}
        />
    </>
  );

  return (
    <div className="flex h-full">
      {telaEstreita ? (
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          {/* O Sheet nasce à direita; aqui ele vira gaveta da esquerda, que é
              de onde a navegação sai em qualquer app de celular. */}
          <SheetContent className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0 data-[state=open]:slide-in-from-left">
            <SheetTitle className="sr-only">Servidores e canais</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
        <header className="@container flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4 shadow-sm">
          {telaEstreita && (
            <button
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir servidores e canais"
              className="-ml-1 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <Menu size={20} />
            </button>
          )}

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

          <div className="ml-auto flex items-center gap-3">
            {routeGuildId && <CampoDeBusca termo={busca} onBuscar={setBusca} />}

            {channel && channel.type !== "VOICE" && (
              <PinnedMessagesPanel
                channelId={channel.id}
                canManage={canInChannel(channel.id, "MANAGE_MESSAGES")}
              />
            )}

            <FavoritasPanel />

            {channel?.type === "VOICE" && (
              <Tooltip label={chatDaVozAberto ? "Fechar chat" : "Abrir chat"}>
                <button
                  onClick={() => setChatDaVozAberto((aberto) => !aberto)}
                  aria-label={chatDaVozAberto ? "Fechar chat" : "Abrir chat"}
                  className={cn(
                    "transition hover:text-ink",
                    chatDaVozAberto ? "text-ink" : "text-ink-muted",
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
              <h3
                className="text-lg font-semibold"
                style={{ fontFamily: familiaDaFonte(channel.fonte) ?? undefined }}
              >
                {channel.name}
              </h3>

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
          <AreaDeConversa>
            <MessageList
              channelId={channel.id}
              channelName={channel.name}
              guildId={channel.guildId ?? undefined}
              currentUserId={user?.id}
              isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
            />
            <RodapeDaConversa>
              <TypingIndicator channelId={channel.id} currentUserId={user?.id} />
              <Composer
                channelId={channel.id}
                channelName={channel.name}
                guildId={channel.guildId ?? undefined}
                podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
                podeAnexar={canInChannel(channel.id, "ATTACH_FILES")}
              />
            </RodapeDaConversa>
          </AreaDeConversa>
        ) : (
          <div className="flex-1" />
        )}
      </main>

      {chatDaVozVisivel && channel && detail && (
        <VoiceChatPanel
          channelId={channel.id}
          channelName={channel.name}
          guildId={detail.guild.id}
          currentUserId={user?.id}
          isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
          podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
          onClose={() => setChatDaVozAberto(false)}
        />
      )}

      {busca && routeGuildId && !chatDaVozVisivel && (
        <PainelDeBusca
          guildId={routeGuildId}
          termo={busca}
          currentUserId={user?.id}
          onFechar={() => setBusca("")}
          onIr={(channelId, messageId) =>
            navigate(`/channels/${routeGuildId}/${channelId}?m=${messageId}`)
          }
        />
      )}

      {showMembers && !chatDaVozVisivel && !busca && (
        <MemberList
          members={detail?.members ?? []}
          roles={detail?.roles ?? []}
          ownerId={detail?.guild.ownerId}
          guildId={detail?.guild.id}
          podeModerar={can("MODERATE_MEMBERS")}
        />
      )}

      {/*
        Por último na fila, à direita de tudo: a ficha empurra a lista de
        membros para o lado em vez de tapá-la. Só a partir de `xl` — abaixo
        disso, duas colunas de 22rem não cabem sem espremer a conversa.
      */}
      <ModeratorView roles={detail?.roles ?? []} />
    </div>
  );
};
