import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router";
import { Menu } from "lucide-react";
import { At, Phone, PhoneSlash, User, VideoCamera } from "@phosphor-icons/react";

import { useFindDms } from "~/@core/application/queries/friend/use-find-dms";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useReadStates } from "~/@core/application/queries/message/use-read-states";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { joinChannel } from "~/@core/lib/websocket/join-channel";
import { Avatar } from "~/components/Avatar";
import { AreaDeConversa, RodapeDaConversa } from "~/features/conversa/components/AreaDeConversa";
import { Composer } from "~/features/conversa/components/Composer";
import { AtivosAgora } from "~/components/AtivosAgora";
import { DmSidebar } from "~/components/DmSidebar";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { PrimeiroServidor } from "~/features/servidor/components/PrimeiroServidor";
import { useTelaEstreita } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { VoiceStage } from "~/features/voz/components/VoiceStage";
import { BotaoDoAplicativo } from "~/components/BotaoDoAplicativo";
import { CaixaDeEntrada } from "~/features/conversa/components/CaixaDeEntrada";
import { PinnedMessagesPanel } from "~/features/conversa/components/PinnedMessagesPanel";
import { PainelDePerfilDoDm } from "~/components/PainelDePerfilDoDm";
import { estaChamando } from "~/features/voz/lib/chamada-no-privado";
import { tocarSom } from "~/lib/ui-sounds";
import { Tooltip } from "~/components/ui/tooltip";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { MessageList } from "~/features/conversa/components/MessageList";
import { TypingIndicator } from "~/features/conversa/components/TypingIndicator";
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

  const { data: guildsDaConta = [], isSuccess: guildsCarregadas } = useFindManyGuilds(true);
  const [dispensado, setDispensado] = useState(false);
  const convidando = guildsCarregadas && guildsDaConta.length === 0 && !dispensado;
  const [perfilAberto, setPerfilAberto] = useState(true);

  const canalEmChamada = useVoiceStore((s) => s.channelId);
  const entrarNaChamada = useVoiceStore((s) => s.join);
  const sairDaChamada = useVoiceStore((s) => s.leave);
  const ligarCamera = useVoiceStore((s) => s.toggleCamera);
  const cameraLigada = useVoiceStore((s) => s.cameraEnabled);
  const chatDaChamada = useVoiceStore((s) => s.chatDaChamada);
  const emChamadaAqui = Boolean(channelId) && canalEmChamada === channelId;

  const naSala = useVoiceStore((s) => s.tiles.length);
  const assistindo = useVoiceStore((s) => Boolean(s.assistindo));
  const chamando = emChamadaAqui && estaChamando({ guildId: null, quantosNaSala: naSala });

  const alguemEntrou = useRef(false);

  useEffect(() => {
    if (!emChamadaAqui) {
      alguemEntrou.current = false;
      return;
    }

    if (naSala > 1) {
      alguemEntrou.current = true;
      return;
    }

    if (!alguemEntrou.current) return;

    const prazo = setTimeout(() => {
      if (useVoiceStore.getState().tiles.length > 1) return;

      void sairDaChamada();
      toast.info("A chamada terminou.");
    }, 4000);

    return () => clearTimeout(prazo);
  }, [emChamadaAqui, naSala, sairDaChamada]);

  const ligarComVideo = async (id: string) => {
    if (!emChamadaAqui) await entrarNaChamada(id);
    if (!useVoiceStore.getState().cameraEnabled) await ligarCamera();
  };

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
    <div className="flex h-full bg-surface-0">
      <PrimeiroServidor aberto={convidando} onFechar={() => setDispensado(true)} />

      {telaEstreita ? (
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetContent className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0">
            <SheetTitle className="sr-only">Conversas</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      {conversa ? (
        <div className="topo-do-miolo flex min-w-0 flex-1 flex-col">
          <header className="regiao-de-arrasto flex h-12 shrink-0 items-center gap-2 border-b border-divisor bg-surface-2 px-4 shadow-sm">
            {telaEstreita && (
              <button
                onClick={() => setMenuAberto(true)}
                aria-label="Abrir conversas"
                className="-ml-1 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
              >
                <Menu size={20} />
              </button>
            )}
            <At weight="bold" size={20} className="text-ink-faint" />
            <h2 className="font-semibold">{conversa.user.displayName}</h2>

            {emChamadaAqui ? (
              <span className="flex items-center gap-1.5 text-sm text-online">
                <Phone size={13} weight="fill" /> Em uma chamada
              </span>
            ) : (
              <span className="text-sm text-ink-faint">@{conversa.user.username}</span>
            )}

            <div className="ml-auto flex items-center gap-1">
              <Tooltip label={emChamadaAqui ? "Desligar" : "Iniciar chamada de voz"}>
                <button
                  onClick={() =>
                    void (emChamadaAqui ? sairDaChamada() : entrarNaChamada(conversa.id))
                  }
                  aria-label={emChamadaAqui ? "Desligar" : "Iniciar chamada de voz"}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition",
                    emChamadaAqui
                      ? "bg-danger text-white hover:brightness-110"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  )}
                >
                  {emChamadaAqui ? (
                    <PhoneSlash size={17} weight="fill" />
                  ) : (
                    <Phone size={17} weight="fill" />
                  )}
                </button>
              </Tooltip>

              <Tooltip label={cameraLigada ? "Desligar a câmera" : "Iniciar chamada de vídeo"}>
                <button
                  onClick={() => void (cameraLigada ? ligarCamera() : ligarComVideo(conversa.id))}
                  aria-label={cameraLigada ? "Desligar a câmera" : "Iniciar chamada de vídeo"}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition",
                    cameraLigada && emChamadaAqui
                      ? "bg-surface-4 text-ink"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  )}
                >
                  <VideoCamera size={17} weight="fill" />
                </button>
              </Tooltip>

              <PinnedMessagesPanel channelId={conversa.id} canManage />

              <Tooltip label={perfilAberto ? "Ocultar perfil" : "Mostrar perfil"}>
                <button
                  onClick={() => setPerfilAberto((aberto) => !aberto)}
                  aria-label={perfilAberto ? "Ocultar perfil" : "Mostrar perfil"}
                  aria-pressed={perfilAberto}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition",
                    perfilAberto
                      ? "bg-surface-4 text-ink"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  )}
                >
                  <User weight="fill" size={17} />
                </button>
              </Tooltip>

              <BotaoDoAplicativo />
              <CaixaDeEntrada />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <main className="flex min-w-0 flex-1 flex-col bg-surface-2">

          {emChamadaAqui && (
            <div
              className={cn(
                "flex flex-col overflow-hidden border-b border-divisor",
                chatDaChamada
                  ? cn("shrink-0", assistindo ? "h-96 max-h-[50vh]" : "h-56")
                  : "min-h-0 flex-1",
              )}
            >
              {chamando ? (
                <Chamando
                  nome={conversa.user.displayName}
                  userId={conversa.user.id}
                  avatarUrl={conversa.user.avatarUrl}
                  onDesistir={() => void sairDaChamada()}
                />
              ) : (
                <VoiceStage channelName={conversa.user.displayName} currentUserId={user.id} compacto />
              )}
            </div>
          )}

          {chatDaChamada && (
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
          )}
            </main>

            {perfilAberto && <PainelDePerfilDoDm userId={conversa.user.id} />}
          </div>
        </div>
      ) : (
        <>
          <Friends onOpenConversation={(userId) => void abrirConversa(userId)} />
          <AtivosAgora />
        </>
      )}
    </div>
  );
};

const INTERVALO_DA_ESPERA_MS = 3_000;

const Chamando: React.FC<{
  nome: string;
  userId: string;
  avatarUrl: string | null;
  onDesistir: () => void;
}> = ({ nome, userId, avatarUrl, onDesistir }) => {
  useEffect(() => {
    tocarSom("chamando");
    const espera = setInterval(() => tocarSom("chamando"), INTERVALO_DA_ESPERA_MS);

    return () => clearInterval(espera);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-2">
      <span className="relative">
        <Avatar id={userId} name={nome} url={avatarUrl} size={72} />
        <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-online" />
      </span>

      <p className="text-sm text-ink-muted">
        Chamando <span className="font-semibold text-ink">{nome}</span>…
      </p>

      <button
        onClick={onDesistir}
        className="flex items-center gap-1.5 rounded-full bg-danger px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
      >
        <PhoneSlash size={15} weight="fill" /> Cancelar
      </button>
    </div>
  );
};
