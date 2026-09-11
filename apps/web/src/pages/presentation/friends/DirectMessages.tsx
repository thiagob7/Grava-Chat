import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router";
import { Menu } from "lucide-react";
import { Check, ShieldCheck } from "@phosphor-icons/react";
import { Phone, PhoneSlash, User, VideoCamera } from "@phosphor-icons/react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import {
  ChatArea,
  ChatPanel,
  ChatFooter,
} from "~/features/conversa/components/AreaDeConversa";
import { Composer } from "~/features/conversa/components/Composer";
import { ActiveNow } from "~/features/amizades/components/AtivosAgora";
import { DmSidebar } from "~/features/amizades/components/DmSidebar";
import { Sheet, SheetCloseButton, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { FirstServer } from "~/features/servidor/components/PrimeiroServidor";
import { useScreenNarrow } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";
import { LeftColumn } from "~/features/app/components/ColunaDaEsquerda";
import { WidthHandle, useResizableWidth } from "~/components/ui/resizable";
import { BarFooter } from "~/features/app/components/RodapeDaBarra";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { VoiceStage } from "~/features/voz/components/VoiceStage";
import { AppButton } from "~/features/app/components/BotaoDoAplicativo";
import { EntryBox } from "~/features/conversa/components/CaixaDeEntrada";
import { PinnedMessagesPanel } from "~/features/conversa/components/PinnedMessagesPanel";
import { ProfileDmPanel } from "~/features/perfil/components/PainelDePerfilDoDm";
import { useTranslation } from "~/traducao";

const HELP = import.meta.env.VITE_HELP_URL as string | undefined;
import { thisCalling } from "~/features/voz/lib/chamada-no-privado";
import { playSound } from "~/lib/ui-sounds";
import { Tooltip } from "~/components/ui/tooltip";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import type { SearchScope } from "~/@core/application/requests/message/buscar-mensagens";
import { SearchField } from "~/features/conversa/components/CampoDeBusca";
import { ChannelStar } from "~/features/conversa/components/EstrelaDoCanal";
import { StartDm } from "~/features/conversa/components/InicioDaDm";
import { MessageList } from "~/features/conversa/components/MessageList";
import { SearchPanel } from "~/features/conversa/components/PainelDeBusca";
import { TypingIndicator } from "~/features/conversa/components/TypingIndicator";
import { useSession } from "~/contexts/session-context";
import { useRealtime } from "~/hooks/use-realtime";
import { Friends } from "~/pages/presentation/friends/Friends";
import { MessagesRequests } from "~/features/amizades/components/SolicitacoesDeMensagens";
import { flx, flxCls } from "~/lib/compat-de-tema";

export const DirectMessages: React.FC<{ requests?: boolean }> = ({ requests = false }) => {
  const { channelId } = useParams();
  const navigate = useNavigate();

  const { user, endSession } = useSession();
  const { data: dms = [] } = useFindDms(true);
  const { data: relations = [] } = useFindFriends(true);
  const { data: readStates = {} } = useReadStates(true);
  const openDm = useOpenDm();
  const logout = useLogout();

  useRealtime(undefined, channelId);

  useEffect(() => {
    if (channelId) void joinChannel(channelId).catch(() => undefined);
  }, [channelId]);

  const chat = dms.find((dm) => dm.id === channelId);
  const pending = relations.filter((r) => r.status === "PENDING_IN").length;

  const openChat = async (userId: string) => {
    const channel = await openDm.mutateAsync(userId).catch(() => null);
    if (channel) navigate(`/dm/${channel.id}`);
  };

  const leave = async () => {
    await logout.mutateAsync().catch(() => undefined);
    endSession();
  };

  const { t } = useTranslation();
  const screenNarrow = useScreenNarrow();
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const { data: accountGuilds = [], isSuccess: guildsLoaded } = useFindManyGuilds(true);
  const [dismissed, setDismissed] = useState(false);
  const inviting = guildsLoaded && accountGuilds.length === 0 && !dismissed;
  const [profileIsOpen, setProfileIsOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScope>("canal");

  const channelCall = useVoiceStore((s) => s.channelId);
  const joinCall = useVoiceStore((s) => s.join);
  const leaveCall = useVoiceStore((s) => s.leave);
  const turnonCamera = useVoiceStore((s) => s.toggleCamera);
  const cameraOn = useVoiceStore((s) => s.cameraEnabled);
  const callChat = useVoiceStore((s) => s.callChat);
  const inCallHere = Boolean(channelId) && channelCall === channelId;

  const inRoom = useVoiceStore((s) => s.tiles.length);
  const watching = useVoiceStore((s) => Boolean(s.watching));
  const calling = inCallHere && thisCalling({ guildId: null, countRoom: inRoom });

  const someoneJoined = useRef(false);

  useEffect(() => {
    if (!inCallHere) {
      someoneJoined.current = false;
      return;
    }

    if (inRoom > 1) {
      someoneJoined.current = true;
      return;
    }

    if (!someoneJoined.current) return;

    const deadline = setTimeout(() => {
      if (useVoiceStore.getState().tiles.length > 1) return;

      void leaveCall();
      toast.info("A chamada terminou.");
    }, 4000);

    return () => clearTimeout(deadline);
  }, [inCallHere, inRoom, leaveCall]);

  const turnonWithVideo = async (id: string) => {
    if (!inCallHere) await joinCall(id);
    if (!useVoiceStore.getState().cameraEnabled) await turnonCamera();
  };

  if (!user) return null;

  const side = useResizableWidth("dm", {
    initial: 320,
    token: "--layout-sidebar-width",
    min: 180,
    max: 420,
    edge: "right",
  });

  const navigation = (
    <LeftColumn data-gc="friends.direct-messages.left-column"
      footer={<BarFooter data-gc="friends.direct-messages.bar-footer" user={user} onLogout={() => void leave()} />}
      alca={
        <WidthHandle data-gc="friends.direct-messages.width-handle"
          edge="right"
          dragging={side.dragging}
          width={side.width}
          bounds={side.bounds}
          {...side.handle}
        />
      }
    >
      <GuildRail data-gc="friends.direct-messages.guild-rail"
        activeGuildId={null}
        onSelect={(id) => navigate(`/channels/${id}`)}
        onOpenFriends={() => navigate("/dm")}
        pendingFriendRequests={pending}
      />

      <DmSidebar data-gc="friends.direct-messages.dm-sidebar"
        activeChannelId={channelId}
        width={side.width}
        fluid={screenNarrow}
        requestsIsOpen={requests}
        onOpenRequests={() => navigate("/dm/solicitacoes")}
        readStates={readStates}
        user={user}
        onOpenFriends={() => navigate("/dm")}
        onSelectDm={(id) => {
          navigate(`/dm/${id}`);
          setMenuIsOpen(false);
        }}
      />
    </LeftColumn>
  );

  return (
    <div data-gc="friends.direct-messages.div" {...flx("chatsPage", "flex h-full bg-surface-0")}>
      <FirstServer data-gc="friends.direct-messages.first-server" isOpen={inviting} onClose={() => setDismissed(true)} />

      {screenNarrow ? (
        <Sheet data-gc="friends.direct-messages.sheet.set-menu-is-open" open={menuIsOpen} onOpenChange={setMenuIsOpen}>
          <SheetContent data-gc="friends.direct-messages.sheet-content" className="inset-y-0 left-0 right-auto w-full max-w-none flex-row p-0 sm:w-[min(24rem,93vw)]">
            <SheetTitle data-gc="friends.direct-messages.sheet-title" className="sr-only">Conversas</SheetTitle>
            <SheetCloseButton data-gc="friends.direct-messages.sheet-close-button" className="absolute right-2 top-2 z-[60] rounded-full bg-surface-3/90 p-1.5 shadow-lg shadow-sombra backdrop-blur-sm sm:hidden" />
            {navigation}
          </SheetContent>
        </Sheet>
      ) : (
        navigation
      )}

      {chat ? (
        <div data-gc="friends.direct-messages.div--2" {...flx("chatDirectColumn", "topo-do-miolo flex min-w-0 flex-1 flex-col")}>
          <header data-gc="friends.direct-messages.header" {...flx("channelTop", "topo-do-canal regiao-de-arrasto h-[var(--layout-header-height)] shrink-0 border-b border-divisor bg-cabecalho shadow-sm")}>
            <div data-gc="friends.direct-messages.div--3"
              {...flx("topChannelCore", "flex h-full w-full items-center gap-2 px-4")}
            >
              {screenNarrow && (
                <button data-gc="friends.direct-messages.button"
                  onClick={() => setMenuIsOpen(true)}
                  aria-label="Abrir conversas"
                  className="-ml-1 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
                >
                  <Menu data-gc="friends.direct-messages.menu" size={20} />
                </button>
              )}
              <Avatar data-gc="friends.direct-messages.avatar"
                id={chat.user.id}
                name={chat.user.displayName}
                url={chat.user.avatarUrl}
                status={chat.user.status}
                size={24}
              />
              <h2 data-gc="friends.direct-messages.h2" className="font-semibold">
                <UserName data-gc="friends.direct-messages.user-name" name={chat.user.displayName} isBot={chat.user.isBot} isSystem={chat.user.system} />
              </h2>

              {inCallHere ? (
                <span data-gc="friends.direct-messages.span" className="flex items-center gap-1.5 text-sm text-online">
                  <Phone data-gc="friends.direct-messages.phone" size={13} weight="fill" /> Em uma chamada
                </span>
              ) : (
                <span data-gc="friends.direct-messages.span--2" className="text-sm text-ink-faint">@{chat.user.username}</span>
              )}

              <div data-gc="friends.direct-messages.div--4" className="ml-auto flex items-center gap-1">
                <Tooltip data-gc="friends.direct-messages.tooltip" label={inCallHere ? "Desligar" : "Iniciar chamada de voz"}>
                  <button data-gc="friends.direct-messages.button--2"
                    onClick={() =>
                      void (inCallHere ? leaveCall() : joinCall(chat.id))
                    }
                    aria-label={inCallHere ? "Desligar" : "Iniciar chamada de voz"}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition",
                      inCallHere
                        ? "bg-danger text-sobre-marca hover:brightness-110"
                        : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                    )}
                  >
                    {inCallHere ? (
                      <PhoneSlash data-gc="friends.direct-messages.phone-slash" size={17} weight="fill" />
                    ) : (
                      <Phone data-gc="friends.direct-messages.phone--2" size={17} weight="fill" />
                    )}
                  </button>
                </Tooltip>

                <Tooltip data-gc="friends.direct-messages.tooltip--2" label={cameraOn ? "Desligar a câmera" : "Iniciar chamada de vídeo"}>
                  <button data-gc="friends.direct-messages.button--3"
                    onClick={() => void (cameraOn ? turnonCamera() : turnonWithVideo(chat.id))}
                    aria-label={cameraOn ? "Desligar a câmera" : "Iniciar chamada de vídeo"}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition",
                      cameraOn && inCallHere
                        ? "bg-surface-4 text-ink"
                        : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                    )}
                  >
                    <VideoCamera data-gc="friends.direct-messages.video-camera" size={17} weight="fill" />
                  </button>
                </Tooltip>

                <PinnedMessagesPanel data-gc="friends.direct-messages.pinned-messages-panel" channelId={chat.id} canManage />

                <Tooltip data-gc="friends.direct-messages.tooltip--3" label={profileIsOpen ? "Ocultar perfil" : "Mostrar perfil"}>
                  <button data-gc="friends.direct-messages.button--4"
                    onClick={() => setProfileIsOpen((isOpen) => !isOpen)}
                    aria-label={profileIsOpen ? "Ocultar perfil" : "Mostrar perfil"}
                    aria-pressed={profileIsOpen}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition",
                      profileIsOpen
                        ? "bg-surface-4 text-ink"
                        : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                    )}
                  >
                    <User data-gc="friends.direct-messages.user" weight="fill" size={17} />
                  </button>
                </Tooltip>

                <ChannelStar data-gc="friends.direct-messages.channel-star" channelId={chat.id} />

                <SearchField data-gc="friends.direct-messages.search-field.set-search"
                  term={search}
                  onSearch={setSearch}
                  scope={searchScope}
                  scopes={["canal", "dms", "tudo"]}
                  onScope={setSearchScope}
                />

                <AppButton data-gc="friends.direct-messages.app-button" />
                <EntryBox data-gc="friends.direct-messages.entry-box" />
              </div>
            </div>
          </header>

          <div data-gc="friends.direct-messages.div--5" className="flex min-h-0 flex-1">
            <main data-gc="friends.direct-messages.main" className="flex min-w-0 flex-1 flex-col bg-surface-2">

          {inCallHere && (
            <div data-gc="friends.direct-messages.div--6"
              className={cn(
                flxCls("callCompact"),
                "flex flex-col overflow-hidden border-b border-divisor",
                callChat
                  ? cn("shrink-0", watching ? "h-96 max-h-[50vh]" : "h-56")
                  : "min-h-0 flex-1",
              )}
            >
              {calling ? (
                <Calling data-gc="friends.direct-messages.calling"
                  name={chat.user.displayName}
                  userId={chat.user.id}
                  avatarUrl={chat.user.avatarUrl}
                  onGiveup={() => void leaveCall()}
                />
              ) : (
                <VoiceStage data-gc="friends.direct-messages.voice-stage" channelName={chat.user.displayName} currentUserId={user.id} compact />
              )}
            </div>
          )}

          {callChat && (
          <ChatArea data-gc="friends.direct-messages.chat-area">
            <ChatPanel data-gc="friends.direct-messages.chat-panel">
            <MessageList data-gc="friends.direct-messages.message-list"
              channelId={chat.id}
              channelName={chat.user.displayName}
              currentUserId={user.id}
              isModerator={false}
              header={
                <StartDm data-gc="friends.direct-messages.start-dm"
                  person={chat.user}
                  channelId={chat.id}
                  empty={!chat.lastMessageId}
                />
              }
            />

            </ChatPanel>

          <ChatFooter data-gc="friends.direct-messages.chat-footer">
            {chat.user.system ? (
              <section
                data-gc="friends.direct-messages.section"
                className="caixa-de-escrever bg-composer px-2 pb-3 @sm:px-3"
              >
                <div data-gc="friends.direct-messages.div--7" className="flex min-h-[var(--composer-box-height)] items-center gap-3 rounded-[var(--footer-box-radius)] bg-campo px-3 py-2 text-sm leading-4 text-ink-muted">
                  <span data-gc="friends.direct-messages.span--3" className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-4 text-ink-muted">
                    <ShieldCheck data-gc="friends.direct-messages.shield-check" size={18} weight="fill" />

                    <span data-gc="friends.direct-messages.span--4" className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full border-2 border-campo bg-brand text-sobre-marca">
                      <Check data-gc="friends.direct-messages.check" size={8} weight="bold" />
                    </span>
                  </span>

                  <span data-gc="friends.direct-messages.span--5" className="min-w-0 flex-1">
                    <span data-gc="friends.direct-messages.span--6" className="block truncate font-semibold text-ink">
                      {t("conversa.oficial.titulo")}
                    </span>
                    <span data-gc="friends.direct-messages.span--7" className="block truncate text-11">
                      {t("conversa.oficial.detalhe")}
                    </span>
                  </span>

                  {HELP && (
                    <a data-gc="friends.direct-messages.a"
                      href={HELP}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md bg-surface-3 px-3 py-1.5 text-13 font-medium text-ink transition hover:bg-surface-4"
                    >
                      {t("conversa.oficial.saibaMais")}
                    </a>
                  )}
                </div>
              </section>
            ) : (
              <>
                <TypingIndicator data-gc="friends.direct-messages.typing-indicator" channelId={chat.id} currentUserId={user.id} />
                <Composer data-gc="friends.direct-messages.composer" channelId={chat.id} channelName={chat.user.displayName} />
              </>
            )}
          </ChatFooter>
          </ChatArea>
          )}
            </main>

            {search ? (
              <SearchPanel data-gc="friends.direct-messages.search-panel"
                channelId={chat.id}
                term={search}
                scope={searchScope}
                currentUserId={user.id}
                onClose={() => setSearch("")}
                onIr={(channel, messageId) => navigate(`/dm/${channel}?m=${messageId}`)}
              />
            ) : (
              profileIsOpen && <ProfileDmPanel data-gc="friends.direct-messages.profile-dm-panel" userId={chat.user.id} />
            )}
          </div>
        </div>
      ) : requests ? (
        <MessagesRequests data-gc="friends.direct-messages.messages-requests" />
      ) : (
        <>
          <Friends data-gc="friends.direct-messages.friends"
            onOpenConversation={(userId) => void openChat(userId)}
            onOpenMenu={screenNarrow ? () => setMenuIsOpen(true) : undefined}
          />
          <ActiveNow data-gc="friends.direct-messages.active-now" />
        </>
      )}
    </div>
  );
};

const WAIT_MS_INTERVAL = 3_000;

const Calling: React.FC<{
  name: string;
  userId: string;
  avatarUrl: string | null;
  onGiveup: () => void;
}> = ({ name, userId, avatarUrl, onGiveup }) => {
  useEffect(() => {
    playSound("calling");
    const wait = setInterval(() => playSound("calling"), WAIT_MS_INTERVAL);

    return () => clearInterval(wait);
  }, []);

  return (
    <div data-gc="friends.direct-messages.div--8" className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-2">
      <span data-gc="friends.direct-messages.span--8" className="relative">
        <Avatar data-gc="friends.direct-messages.avatar--2" id={userId} name={name} url={avatarUrl} size={72} />
        <span data-gc="friends.direct-messages.span--9" className="absolute inset-0 animate-ping rounded-full ring-2 ring-online" />
      </span>

      <p data-gc="friends.direct-messages.p" className="text-sm text-ink-muted">
        Chamando <span data-gc="friends.direct-messages.span--10" className="font-semibold text-ink">{name}</span>…
      </p>

      <button data-gc="friends.direct-messages.button.on-giveup"
        onClick={onGiveup}
        className="flex items-center gap-1.5 rounded-full bg-danger px-4 py-2 text-sm font-medium text-sobre-marca transition hover:brightness-110"
      >
        <PhoneSlash data-gc="friends.direct-messages.phone-slash--2" size={15} weight="fill" /> Cancelar
      </button>
    </div>
  );
};
