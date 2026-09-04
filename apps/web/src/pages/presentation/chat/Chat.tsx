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
  Star,
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
import { AreaDeConversa, RodapeDaConversa } from "~/components/AreaDeConversa";
import { CampoDeBusca } from "~/components/CampoDeBusca";
import { ChannelSidebar } from "~/components/ChannelSidebar";
import { Composer } from "~/components/Composer";
import { ForumChannel } from "~/components/ForumChannel";
import { ForumPostView } from "~/components/ForumPostView";
import { PinnedMessagesPanel } from "~/components/PinnedMessagesPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAvisos, type ModoDoCanal } from "~/stores/notificacoes";
import { useFavoritos } from "~/stores/favoritos";
import { BotaoDoAplicativo } from "~/components/BotaoDoAplicativo";
import { CaixaDeEntrada } from "~/components/CaixaDeEntrada";
import { VoiceChatPanel } from "~/components/VoiceChatPanel";
import { GuildRail } from "~/components/GuildRail";
import { MemberList } from "~/components/MemberList";
import { MessageList } from "~/components/MessageList";
import { ConfirmacaoDeVoz } from "~/components/ConfirmacaoDeVoz";
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
    <div className="flex h-full bg-surface-0">
      {telaEstreita ? (
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetContent className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0">
            <SheetTitle className="sr-only">Servidores e canais</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      <div className="topo-do-miolo flex min-w-0 flex-1 flex-col">
        {!semCabecalho && (
        <header className="regiao-de-arrasto @container flex h-12 shrink-0 items-center gap-2 border-b border-divisor bg-cabecalho px-4 shadow-sm">
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
            <SpeakerHigh size={20} weight="fill" className="text-ink-faint" />
          ) : channel?.type === "FORUM" ? (
            <ChatsCircle size={20} weight="fill" className="text-ink-faint" />
          ) : (
            <Hash size={20} weight="bold" className="text-ink-faint" />
          )}
          <h2 className="font-semibold">{channel?.name ?? "…"}</h2>

          {channel?.topic && (
            <>
              <span className="mx-1 h-5 w-px bg-line" />
              <p className="truncate text-sm text-ink-muted">{channel.topic}</p>
            </>
          )}

          <div className="ml-auto flex items-center gap-3">
            {channel && channel.type !== "VOICE" && <SinoDoCanal channelId={channel.id} />}

            {channel && channel.type !== "VOICE" && (
              <PinnedMessagesPanel
                channelId={channel.id}
                canManage={canInChannel(channel.id, "MANAGE_MESSAGES")}
              />
            )}

            {channel && <EstrelaDoCanal channelId={channel.id} />}

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
                  <ChatCircle size={20} weight="fill" />
                </button>
              </Tooltip>
            )}

            <Tooltip label="Membros">
              <button
                onClick={() => setShowMembers((v) => !v)}
                className={`transition hover:text-ink ${showMembers ? "text-ink" : "text-ink-muted"}`}
              >
                <Users size={20} weight="fill" />
              </button>
            </Tooltip>

            {routeGuildId && <CampoDeBusca termo={busca} onBuscar={setBusca} />}

            <BotaoDoAplicativo />
            <CaixaDeEntrada />
          </div>
        </header>
        )}

        <div className="flex min-h-0 flex-1">
          <main className="flex min-w-0 flex-1 flex-col bg-surface-2">

        {channel?.type === "VOICE" ? (
          voiceChannelId === channel.id ? (
            <VoiceStage
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
            <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
              {semCabecalho && (
                <div className="regiao-de-arrasto absolute inset-x-0 top-0 h-12" />
              )}

              <SpeakerHigh size={48} weight="fill" className="text-ink-faint" />
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
                modoLento={channel.slowmodeSeconds}
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

          {showMembers && channel?.type !== "VOICE" && !chatDaVozVisivel && !busca && (
            <MemberList
              members={detail?.members ?? []}
              carregando={!detail}
              roles={detail?.roles ?? []}
              ownerId={detail?.guild.ownerId}
              guildId={detail?.guild.id}
              podeModerar={can("MODERATE_MEMBERS")}
              emVoz={quemEstaEmVoz}
            />
          )}

          <ModeratorView roles={detail?.roles ?? []} />
        </div>
      </div>

      <ConfirmacaoDeVoz
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Avisos deste canal"
          className={cn(
            "rounded p-1.5 transition hover:bg-surface-3 hover:text-ink",
            modo === "nada" ? "text-ink-faint" : "text-ink-muted",
          )}
        >
          <Tooltip label={modo === "nada" ? "Canal silenciado" : "Avisos deste canal"}>
            {modo === "nada" ? (
              <BellSlash size={18} weight="fill" />
            ) : (
              <Bell size={18} weight="fill" />
            )}
          </Tooltip>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {opcoes.map((opcao) => (
          <DropdownMenuItem
            key={opcao.rotulo}
            onSelect={() => definirCanal(channelId, opcao.modo)}
            className="flex-col items-start gap-0"
          >
            <span className="flex w-full items-center justify-between gap-2">
              {opcao.rotulo}
              {modo === opcao.modo && <Check size={15} className="shrink-0 text-brand" />}
            </span>
            <span className="text-xs text-ink-faint">{opcao.detalhe}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const EstrelaDoCanal: React.FC<{ channelId: string }> = ({ channelId }) => {
  const favorito = useFavoritos((s) => s.canais.includes(channelId));
  const alternar = useFavoritos((s) => s.alternar);

  return (
    <Tooltip label={favorito ? "Tirar dos favoritos" : "Favoritar o canal"}>
      <button
        onClick={() => alternar(channelId)}
        aria-label={favorito ? "Tirar dos favoritos" : "Favoritar o canal"}
        aria-pressed={favorito}
        className={cn("transition hover:text-ink", favorito ? "text-idle" : "text-ink-muted")}
      >
        <Star size={20} weight={favorito ? "fill" : "regular"} />
      </button>
    </Tooltip>
  );
};
