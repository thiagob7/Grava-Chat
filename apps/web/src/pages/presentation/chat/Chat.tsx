import React, { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { Check, Menu } from "lucide-react";
import {
  Bell,
  BellSlash,
  ChatCircle,
  ChatsCircle,
  Hash,
  SpeakerHigh,
  Users,
} from "@phosphor-icons/react";

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
import { AreaDeConversa, RodapeDaConversa } from "~/features/conversa/components/AreaDeConversa";
import { CampoDeBusca } from "~/features/conversa/components/CampoDeBusca";
import { ChannelSidebar } from "~/features/servidor/components/ChannelSidebar";
import { Composer } from "~/features/conversa/components/Composer";
import { ForumChannel } from "~/features/conversa/components/ForumChannel";
import { ForumPostView } from "~/features/conversa/components/ForumPostView";
import { PinnedMessagesPanel } from "~/features/conversa/components/PinnedMessagesPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAvisos, type ModoDoCanal } from "~/stores/notificacoes";
import { BotaoDoAplicativo } from "~/features/app/components/BotaoDoAplicativo";
import { CaixaDeEntrada } from "~/features/conversa/components/CaixaDeEntrada";
import { VoiceChatPanel } from "~/features/voz/components/VoiceChatPanel";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { MemberList } from "~/features/servidor/components/MemberList";
import { MessageList } from "~/features/conversa/components/MessageList";
import { ConfirmacaoDeVoz } from "~/features/voz/components/ConfirmacaoDeVoz";
import { ModeratorView } from "~/features/servidor/components/ModeratorView";
import { EstrelaDoCanal } from "~/features/conversa/components/EstrelaDoCanal";
import { PainelDeBusca } from "~/features/conversa/components/PainelDeBusca";
import { TypingIndicator } from "~/features/conversa/components/TypingIndicator";
import { VoiceStage } from "~/features/voz/components/VoiceStage";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useSession } from "~/contexts/session-context";
import { usePermissions } from "~/hooks/use-permissions";
import { useRealtime } from "~/hooks/use-realtime";
import { useReconnectVoice } from "~/features/voz/hooks/use-reconnect-voice";
import { useModeracao } from "~/features/servidor/stores/moderacao";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { familiaDaFonte } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { flx } from "~/lib/compat-fluxer";

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
  const [chatDaVozAberto, setChatDaVozAberto] = useState(false);
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

    if (target.type === "TEXT" || target.type === "FORUM" || target.type === "VOICE") {
      void joinChannel(target.id).catch(() => undefined);
    }
  }, [routeGuildId, routeChannelId, detail, navigate]);

  useEffect(() => setPostAberto(null), [routeChannelId]);
  useEffect(() => setBusca(""), [routeGuildId]);
  useEffect(() => useModeracao.getState().fechar(), [routeGuildId]);

  const channel = detail?.channels.find((c) => c.id === routeChannelId);
  const chatDaVozVisivel = chatDaVozAberto && channel?.type === "VOICE";
  const summary = guilds.find((g) => g.id === routeGuildId);
  const { can, canInChannel } = usePermissions(detail);
  const pedidosPendentes = relacoes.filter((r) => r.status === "PENDING_IN").length;

  const myVoiceState = Object.values(detail?.voiceStates ?? {})
    .flat()
    .find((state) => state.userId === user?.id);

  const accountVoiceChannelId = myVoiceState?.channelId ?? null;

  const quemEstaEmVoz = new Set(
    Object.values(detail?.voiceStates ?? {})
      .flat()
      .map((estado) => estado.userId),
  );

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
    if (contaJaEstaNesteCanal) return setConfirmandoVoz(channelId);
    if (!canInChannel(channelId, "CONNECT")) return;
    if (!voiceReachable) return;

    void joinVoice(channelId).catch(() => undefined);
  };

  const telaEstreita = useTelaEstreita();
  const [menuAberto, setMenuAberto] = useState(false);

  const semCabecalho = channel?.type === "VOICE" && !telaEstreita;
  const [confirmandoVoz, setConfirmandoVoz] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    endSession();
  };

  if (guildsLoaded && !guilds.length) return <Navigate to="/dm" replace />;

  const navegacao = (
    <>
        <GuildRail data-gc="chat.chat.guild-rail"
          activeGuildId={routeGuildId ?? null}
          onSelect={(id) => navigate(`/channels/${id}`)}
          onOpenFriends={() => navigate("/dm")}
          pendingFriendRequests={pedidosPendentes}
        />

        <ChannelSidebar data-gc="chat.chat.channel-sidebar"
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
    <div data-gc="chat.chat.div" {...flx("linhaDoApp", "flex h-full bg-surface-0")}>
      {telaEstreita ? (
        <Sheet data-gc="chat.chat.sheet.set-menu-aberto" open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetContent data-gc="chat.chat.sheet-content" className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0">
            <SheetTitle data-gc="chat.chat.sheet-title" className="sr-only">Servidores e canais</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      <div data-gc="chat.chat.div--2" {...flx("colunaDoMiolo", "topo-do-miolo flex min-w-0 flex-1 flex-col")}>
        {!semCabecalho && (
        <header data-gc="chat.chat.header" {...flx("topoDoCanal", "topo-do-canal regiao-de-arrasto @container flex h-[var(--layout-header-height)] shrink-0 items-center gap-2 border-b border-divisor bg-cabecalho px-4 shadow-sm")}>
          {telaEstreita && (
            <button data-gc="chat.chat.button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir servidores e canais"
              className="-ml-1 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <Menu data-gc="chat.chat.menu" size={20} />
            </button>
          )}

          {channel?.type === "VOICE" ? (
            <SpeakerHigh data-gc="chat.chat.speaker-high" size={20} weight="fill" className="text-ink-faint" />
          ) : channel?.type === "FORUM" ? (
            <ChatsCircle data-gc="chat.chat.chats-circle" size={20} weight="fill" className="text-ink-faint" />
          ) : (
            <Hash data-gc="chat.chat.hash" size={20} weight="bold" className="text-ink-faint" />
          )}
          <h2 data-gc="chat.chat.h2" className="font-semibold">{channel?.name ?? "…"}</h2>

          {channel?.topic && (
            <>
              <span data-gc="chat.chat.span" className="mx-1 h-5 w-px bg-line" />
              <p data-gc="chat.chat.p" className="truncate text-sm text-ink-muted">{channel.topic}</p>
            </>
          )}

          <div data-gc="chat.chat.div--3" className="ml-auto flex items-center gap-3">
            {channel && channel.type !== "VOICE" && <SinoDoCanal data-gc="chat.chat.sino-do-canal" channelId={channel.id} />}

            {channel && channel.type !== "VOICE" && (
              <PinnedMessagesPanel data-gc="chat.chat.pinned-messages-panel"
                channelId={channel.id}
                canManage={canInChannel(channel.id, "MANAGE_MESSAGES")}
              />
            )}

            {channel && <EstrelaDoCanal data-gc="chat.chat.estrela-do-canal" channelId={channel.id} />}

            {channel?.type === "VOICE" && (
              <Tooltip data-gc="chat.chat.tooltip" label={chatDaVozAberto ? "Fechar chat" : "Abrir chat"}>
                <button data-gc="chat.chat.button--2"
                  onClick={() => setChatDaVozAberto((aberto) => !aberto)}
                  aria-label={chatDaVozAberto ? "Fechar chat" : "Abrir chat"}
                  className={cn(
                    "transition hover:text-ink",
                    chatDaVozAberto ? "text-ink" : "text-ink-muted",
                  )}
                >
                  <ChatCircle data-gc="chat.chat.chat-circle" size={20} weight="fill" />
                </button>
              </Tooltip>
            )}

            <Tooltip data-gc="chat.chat.tooltip--2" label="Membros">
              <button data-gc="chat.chat.button--3"
                onClick={() => setShowMembers((v) => !v)}
                className={`transition hover:text-ink ${showMembers ? "text-ink" : "text-ink-muted"}`}
              >
                <Users data-gc="chat.chat.users" size={20} weight="fill" />
              </button>
            </Tooltip>

            {routeGuildId && <CampoDeBusca data-gc="chat.chat.campo-de-busca.set-busca" termo={busca} onBuscar={setBusca} />}

            <BotaoDoAplicativo data-gc="chat.chat.botao-do-aplicativo" />
            <CaixaDeEntrada data-gc="chat.chat.caixa-de-entrada" />
          </div>
        </header>
        )}

        <div data-gc="chat.chat.div--4" className="flex min-h-0 flex-1">
          <main data-gc="chat.chat.main" className="flex min-w-0 flex-1 flex-col bg-surface-2">

        {channel?.type === "VOICE" ? (
          voiceChannelId === channel.id ? (
            <VoiceStage data-gc="chat.chat.voice-stage"
              channelName={channel.name}
              guildId={detail?.guild.id}
              guildName={detail?.guild.name}
              members={detail?.members}
              roles={detail?.roles}
              canaisDeVoz={detail?.channels.filter((c) => c.type === "VOICE")}
              voiceStates={detail?.voiceStates[channel.id]}
              minhasPermissoes={detail?.permissions}
              currentUserId={user?.id}
              chatAberto={chatDaVozAberto}
              onAlternarChat={() => setChatDaVozAberto((aberto) => !aberto)}
              podeConvidar={can("CREATE_INVITE")}
            />
          ) : (
            <div data-gc="chat.chat.div--5" className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
              {semCabecalho && (
                <div data-gc="chat.chat.div--6" className="regiao-de-arrasto absolute inset-x-0 top-0 h-12" />
              )}

              <SpeakerHigh data-gc="chat.chat.speaker-high--2" size={48} weight="fill" className="text-ink-faint" />
              <h3 data-gc="chat.chat.h3"
                className="text-lg font-semibold"
                style={{ fontFamily: familiaDaFonte(channel.fonte) ?? undefined }}
              >
                {channel.name}
              </h3>

              {!canInChannel(channel.id, "CONNECT") ? (
                <p data-gc="chat.chat.p--2" className="max-w-sm text-sm text-ink-muted">
                  Você não tem permissão para entrar nesta chamada.
                </p>
              ) : !voiceReachable ? (
                <p data-gc="chat.chat.p--3" className="max-w-sm text-sm text-ink-muted">
                  A voz não está disponível neste acesso — o servidor de voz roda só na máquina de
                  quem hospeda. O chat, os anexos e o resto funcionam normalmente.
                </p>
              ) : accountVoiceChannelId === channel.id && inCallElsewhere ? (
                <>
                  <p data-gc="chat.chat.p--4" className="max-w-xs text-sm text-ink-muted">
                    Você já está nesta chamada — só que em outra aba. O áudio está tocando lá.
                  </p>
                  <Button data-gc="chat.chat.button--4" onClick={() => void joinVoice(channel.id).catch(() => undefined)}>
                    Trazer a chamada para esta aba
                  </Button>
                </>
              ) : (
                <Button data-gc="chat.chat.button--5"
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
            <ForumPostView data-gc="chat.chat.forum-post-view"
              post={postAberto}
              guildId={channel.guildId ?? ""}
              currentUserId={user?.id}
              isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
              podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
              onVoltar={() => setPostAberto(null)}
            />
          ) : (
            <ForumChannel data-gc="chat.chat.forum-channel.set-post-aberto"
              channelId={channel.id}
              channelName={channel.name}
              podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
              onAbrirPost={setPostAberto}
            />
          )
        ) : channel ? (
          <AreaDeConversa data-gc="chat.chat.area-de-conversa">
            <MessageList data-gc="chat.chat.message-list"
              channelId={channel.id}
              channelName={channel.name}
              guildId={channel.guildId ?? undefined}
              currentUserId={user?.id}
              isModerator={canInChannel(channel.id, "MANAGE_MESSAGES")}
            />
            <RodapeDaConversa data-gc="chat.chat.rodape-da-conversa">
              <TypingIndicator data-gc="chat.chat.typing-indicator" channelId={channel.id} currentUserId={user?.id} />
              <Composer data-gc="chat.chat.composer"
                channelId={channel.id}
                channelName={channel.name}
                guildId={channel.guildId ?? undefined}
                podeEscrever={canInChannel(channel.id, "SEND_MESSAGES")}
                podeAnexar={canInChannel(channel.id, "ATTACH_FILES")}
                modoLento={channel.slowmodeSeconds}
              />
            </RodapeDaConversa>
          </AreaDeConversa>
        ) : (
          <div data-gc="chat.chat.div--7" className="flex-1" />
        )}
          </main>

          {chatDaVozVisivel && channel && detail && (
            <VoiceChatPanel data-gc="chat.chat.voice-chat-panel"
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
            <PainelDeBusca data-gc="chat.chat.painel-de-busca"
              guildId={routeGuildId}
              termo={busca}
              currentUserId={user?.id}
              onFechar={() => setBusca("")}
              onIr={(channelId, messageId) =>
                navigate(`/channels/${routeGuildId}/${channelId}?m=${messageId}`)
              }
            />
          )}

          {showMembers && channel?.type !== "VOICE" && !chatDaVozVisivel && !busca && (
            <MemberList data-gc="chat.chat.member-list"
              members={detail?.members ?? []}
              carregando={!detail}
              roles={detail?.roles ?? []}
              ownerId={detail?.guild.ownerId}
              guildId={detail?.guild.id}
              podeModerar={can("MODERATE_MEMBERS")}
              emVoz={quemEstaEmVoz}
            />
          )}

          <ModeratorView data-gc="chat.chat.moderator-view" roles={detail?.roles ?? []} />
        </div>
      </div>

      <ConfirmacaoDeVoz data-gc="chat.chat.confirmacao-de-voz"
        canal={
          confirmandoVoz
            ? (detail?.channels.find((c) => c.id === confirmandoVoz)?.name ?? null)
            : null
        }
        onFechar={() => setConfirmandoVoz(null)}
        onTrazerParaCa={() => {
          const alvo = confirmandoVoz;
          setConfirmandoVoz(null);
          if (alvo) void joinVoice(alvo).catch(() => undefined);
        }}
      />
    </div>
  );
};

const SinoDoCanal: React.FC<{ channelId: string }> = ({ channelId }) => {
  const modo = useAvisos((s) => s.porCanal[channelId] ?? null);
  const definirCanal = useAvisos((s) => s.definirCanal);

  const opcoes: { modo: ModoDoCanal | null; rotulo: string; detalhe: string }[] = [
    { modo: null, rotulo: "Seguir o padrão", detalhe: "o que estiver em Notificações" },
    { modo: "tudo", rotulo: "Todas as mensagens", detalhe: "avisa de tudo o que chegar" },
    { modo: "mencoes", rotulo: "Só menções", detalhe: "avisa quando falarem com você" },
    { modo: "nada", rotulo: "Silenciar canal", detalhe: "nenhum aviso, nenhum som" },
  ];

  return (
    <DropdownMenu data-gc="chat.chat.dropdown-menu">
      <DropdownMenuTrigger data-gc="chat.chat.dropdown-menu-trigger" asChild>
        <button data-gc="chat.chat.button--6"
          aria-label="Avisos deste canal"
          className={cn(
            "rounded p-1.5 transition hover:bg-surface-3 hover:text-ink",
            modo === "nada" ? "text-ink-faint" : "text-ink-muted",
          )}
        >
          <Tooltip data-gc="chat.chat.tooltip--3" label={modo === "nada" ? "Canal silenciado" : "Avisos deste canal"}>
            {modo === "nada" ? (
              <BellSlash data-gc="chat.chat.bell-slash" size={18} weight="fill" />
            ) : (
              <Bell data-gc="chat.chat.bell" size={18} weight="fill" />
            )}
          </Tooltip>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent data-gc="chat.chat.dropdown-menu-content" align="end" className="w-64">
        {opcoes.map((opcao) => (
          <DropdownMenuItem data-gc="chat.chat.dropdown-menu-item"
            key={opcao.rotulo}
            onSelect={() => definirCanal(channelId, opcao.modo)}
            className="flex-col items-start gap-0"
          >
            <span data-gc="chat.chat.span--2" className="flex w-full items-center justify-between gap-2">
              {opcao.rotulo}
              {modo === opcao.modo && <Check data-gc="chat.chat.check" size={15} className="shrink-0 text-brand" />}
            </span>
            <span data-gc="chat.chat.span--3" className="text-xs text-ink-faint">{opcao.detalhe}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

