import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router";
import { Menu, Info } from "lucide-react";
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
  AreaDeConversa,
  PainelDaConversa,
  RodapeDaConversa,
} from "~/features/conversa/components/AreaDeConversa";
import { Composer } from "~/features/conversa/components/Composer";
import { AtivosAgora } from "~/features/amizades/components/AtivosAgora";
import { DmSidebar } from "~/features/amizades/components/DmSidebar";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { useFindManyGuilds } from "~/@core/application/queries/guild/use-find-many-guilds";
import { PrimeiroServidor } from "~/features/servidor/components/PrimeiroServidor";
import { useTelaEstreita } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";
import { ColunaDaEsquerda } from "~/features/app/components/ColunaDaEsquerda";
import { RodapeDaBarra } from "~/features/app/components/RodapeDaBarra";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { VoiceStage } from "~/features/voz/components/VoiceStage";
import { BotaoDoAplicativo } from "~/features/app/components/BotaoDoAplicativo";
import { CaixaDeEntrada } from "~/features/conversa/components/CaixaDeEntrada";
import { PinnedMessagesPanel } from "~/features/conversa/components/PinnedMessagesPanel";
import { PainelDePerfilDoDm } from "~/features/perfil/components/PainelDePerfilDoDm";
import { estaChamando } from "~/features/voz/lib/chamada-no-privado";
import { tocarSom } from "~/lib/ui-sounds";
import { Tooltip } from "~/components/ui/tooltip";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import type { EscopoDeBusca } from "~/@core/application/requests/message/buscar-mensagens";
import { CampoDeBusca } from "~/features/conversa/components/CampoDeBusca";
import { EstrelaDoCanal } from "~/features/conversa/components/EstrelaDoCanal";
import { InicioDaDm } from "~/features/conversa/components/InicioDaDm";
import { MessageList } from "~/features/conversa/components/MessageList";
import { PainelDeBusca } from "~/features/conversa/components/PainelDeBusca";
import { TypingIndicator } from "~/features/conversa/components/TypingIndicator";
import { useSession } from "~/contexts/session-context";
import { useRealtime } from "~/hooks/use-realtime";
import { Friends } from "~/pages/presentation/friends/Friends";
import { flx, flxCls } from "~/lib/compat-de-tema";

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
  const [busca, setBusca] = useState("");
  const [escopoDaBusca, setEscopoDaBusca] = useState<EscopoDeBusca>("canal");

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
    <ColunaDaEsquerda data-gc="friends.direct-messages.coluna-da-esquerda" rodape={<RodapeDaBarra data-gc="friends.direct-messages.rodape-da-barra" user={user} onLogout={() => void sair()} />}>
      <GuildRail data-gc="friends.direct-messages.guild-rail"
        activeGuildId={null}
        onSelect={(id) => navigate(`/channels/${id}`)}
        onOpenFriends={() => navigate("/dm")}
        pendingFriendRequests={pendentes}
      />

      <DmSidebar data-gc="friends.direct-messages.dm-sidebar"
        activeChannelId={channelId}
        readStates={readStates}
        user={user}
        onOpenFriends={() => navigate("/dm")}
        onSelectDm={(id) => {
          navigate(`/dm/${id}`);
          setMenuAberto(false);
        }}
      />
    </ColunaDaEsquerda>
  );

  return (
    <div data-gc="friends.direct-messages.div" {...flx("paginaDeConversas", "flex h-full bg-surface-0")}>
      <PrimeiroServidor data-gc="friends.direct-messages.primeiro-servidor" aberto={convidando} onFechar={() => setDispensado(true)} />

      {telaEstreita ? (
        <Sheet data-gc="friends.direct-messages.sheet.set-menu-aberto" open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetContent data-gc="friends.direct-messages.sheet-content" className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0">
            <SheetTitle data-gc="friends.direct-messages.sheet-title" className="sr-only">Conversas</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      {conversa ? (
        <div data-gc="friends.direct-messages.div--2" {...flx("colunaDaConversaDireta", "topo-do-miolo flex min-w-0 flex-1 flex-col")}>
          <header data-gc="friends.direct-messages.header" {...flx("topoDoCanal", "topo-do-canal regiao-de-arrasto h-[var(--layout-header-height)] shrink-0 border-b border-divisor bg-surface-2 shadow-sm")}>
            <div data-gc="friends.direct-messages.div--3"
              {...flx("mioloDoTopoDoCanal", "flex h-full w-full items-center gap-2 px-4")}
            >
              {telaEstreita && (
                <button data-gc="friends.direct-messages.button"
                  onClick={() => setMenuAberto(true)}
                  aria-label="Abrir conversas"
                  className="-ml-1 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
                >
                  <Menu data-gc="friends.direct-messages.menu" size={20} />
                </button>
              )}
              <Avatar data-gc="friends.direct-messages.avatar"
                id={conversa.user.id}
                name={conversa.user.displayName}
                url={conversa.user.avatarUrl}
                status={conversa.user.status}
                size={24}
              />
              <h2 data-gc="friends.direct-messages.h2" className="font-semibold">
                <UserName data-gc="friends.direct-messages.user-name" nome={conversa.user.displayName} ehBot={conversa.user.isBot} ehSistema={conversa.user.sistema} />
              </h2>

              {emChamadaAqui ? (
                <span data-gc="friends.direct-messages.span" className="flex items-center gap-1.5 text-sm text-online">
                  <Phone data-gc="friends.direct-messages.phone" size={13} weight="fill" /> Em uma chamada
                </span>
              ) : (
                <span data-gc="friends.direct-messages.span--2" className="text-sm text-ink-faint">@{conversa.user.username}</span>
              )}

              <div data-gc="friends.direct-messages.div--4" className="ml-auto flex items-center gap-1">
                <Tooltip data-gc="friends.direct-messages.tooltip" label={emChamadaAqui ? "Desligar" : "Iniciar chamada de voz"}>
                  <button data-gc="friends.direct-messages.button--2"
                    onClick={() =>
                      void (emChamadaAqui ? sairDaChamada() : entrarNaChamada(conversa.id))
                    }
                    aria-label={emChamadaAqui ? "Desligar" : "Iniciar chamada de voz"}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition",
                      emChamadaAqui
                        ? "bg-danger text-sobre-marca hover:brightness-110"
                        : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                    )}
                  >
                    {emChamadaAqui ? (
                      <PhoneSlash data-gc="friends.direct-messages.phone-slash" size={17} weight="fill" />
                    ) : (
                      <Phone data-gc="friends.direct-messages.phone--2" size={17} weight="fill" />
                    )}
                  </button>
                </Tooltip>

                <Tooltip data-gc="friends.direct-messages.tooltip--2" label={cameraLigada ? "Desligar a câmera" : "Iniciar chamada de vídeo"}>
                  <button data-gc="friends.direct-messages.button--3"
                    onClick={() => void (cameraLigada ? ligarCamera() : ligarComVideo(conversa.id))}
                    aria-label={cameraLigada ? "Desligar a câmera" : "Iniciar chamada de vídeo"}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition",
                      cameraLigada && emChamadaAqui
                        ? "bg-surface-4 text-ink"
                        : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                    )}
                  >
                    <VideoCamera data-gc="friends.direct-messages.video-camera" size={17} weight="fill" />
                  </button>
                </Tooltip>

                <PinnedMessagesPanel data-gc="friends.direct-messages.pinned-messages-panel" channelId={conversa.id} canManage />

                <Tooltip data-gc="friends.direct-messages.tooltip--3" label={perfilAberto ? "Ocultar perfil" : "Mostrar perfil"}>
                  <button data-gc="friends.direct-messages.button--4"
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
                    <User data-gc="friends.direct-messages.user" weight="fill" size={17} />
                  </button>
                </Tooltip>

                <EstrelaDoCanal data-gc="friends.direct-messages.estrela-do-canal" channelId={conversa.id} />

                <CampoDeBusca data-gc="friends.direct-messages.campo-de-busca.set-busca"
                  termo={busca}
                  onBuscar={setBusca}
                  escopo={escopoDaBusca}
                  escopos={["canal", "dms", "tudo"]}
                  onEscopo={setEscopoDaBusca}
                />

                <BotaoDoAplicativo data-gc="friends.direct-messages.botao-do-aplicativo" />
                <CaixaDeEntrada data-gc="friends.direct-messages.caixa-de-entrada" />
              </div>
            </div>
          </header>

          <div data-gc="friends.direct-messages.div--5" className="flex min-h-0 flex-1">
            <main data-gc="friends.direct-messages.main" className="flex min-w-0 flex-1 flex-col bg-surface-2">

          {emChamadaAqui && (
            <div data-gc="friends.direct-messages.div--6"
              className={cn(
                flxCls("chamadaCompacta"),
                "flex flex-col overflow-hidden border-b border-divisor",
                chatDaChamada
                  ? cn("shrink-0", assistindo ? "h-96 max-h-[50vh]" : "h-56")
                  : "min-h-0 flex-1",
              )}
            >
              {chamando ? (
                <Chamando data-gc="friends.direct-messages.chamando"
                  nome={conversa.user.displayName}
                  userId={conversa.user.id}
                  avatarUrl={conversa.user.avatarUrl}
                  onDesistir={() => void sairDaChamada()}
                />
              ) : (
                <VoiceStage data-gc="friends.direct-messages.voice-stage" channelName={conversa.user.displayName} currentUserId={user.id} compacto />
              )}
            </div>
          )}

          {chatDaChamada && (
          <AreaDeConversa data-gc="friends.direct-messages.area-de-conversa">
            <PainelDaConversa data-gc="friends.direct-messages.painel-da-conversa">
            <MessageList data-gc="friends.direct-messages.message-list"
              channelId={conversa.id}
              channelName={conversa.user.displayName}
              currentUserId={user.id}
              isModerator={false}
              header={<InicioDaDm data-gc="friends.direct-messages.inicio-da-dm" pessoa={conversa.user} />}
            />

            </PainelDaConversa>

          <RodapeDaConversa data-gc="friends.direct-messages.rodape-da-conversa">
            {/*
              O aviso ocupa o lugar da caixa de escrever, e por isso veste a
              forma dela: mesma moldura, mesmo recuo, mesmo canto. Uma faixa de
              ponta a ponta dizia "isto é outra coisa" — e não é: é o que
              existe ali onde se escreveria.
            */}
            {conversa.user.sistema ? (
              <section
                data-gc="friends.direct-messages.section"
                className="caixa-de-escrever bg-composer px-2 pb-3 @sm:px-3"
              >
                <p data-gc="friends.direct-messages.p" className="flex min-h-[var(--footer-box-height)] items-center gap-3 rounded-[var(--footer-box-radius)] bg-campo px-3 text-sm text-ink-muted">
                  <span data-gc="friends.direct-messages.span--3" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink-faint text-surface-1">
                    <Info data-gc="friends.direct-messages.info" size={13} strokeWidth={2.5} />
                  </span>
                  Comunicados do sistema do Gravaê. Não é possível responder aqui.
                </p>
              </section>
            ) : (
              <>
                <TypingIndicator data-gc="friends.direct-messages.typing-indicator" channelId={conversa.id} currentUserId={user.id} />
                <Composer data-gc="friends.direct-messages.composer" channelId={conversa.id} channelName={conversa.user.displayName} />
              </>
            )}
          </RodapeDaConversa>
          </AreaDeConversa>
          )}
            </main>

            {busca ? (
              <PainelDeBusca data-gc="friends.direct-messages.painel-de-busca"
                canalId={conversa.id}
                termo={busca}
                escopo={escopoDaBusca}
                currentUserId={user.id}
                onFechar={() => setBusca("")}
                onIr={(canal, messageId) => navigate(`/dm/${canal}?m=${messageId}`)}
              />
            ) : (
              perfilAberto && <PainelDePerfilDoDm data-gc="friends.direct-messages.painel-de-perfil-do-dm" userId={conversa.user.id} />
            )}
          </div>
        </div>
      ) : (
        <>
          <Friends data-gc="friends.direct-messages.friends" onOpenConversation={(userId) => void abrirConversa(userId)} />
          <AtivosAgora data-gc="friends.direct-messages.ativos-agora" />
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
    <div data-gc="friends.direct-messages.div--7" className="flex flex-1 flex-col items-center justify-center gap-3 bg-surface-2">
      <span data-gc="friends.direct-messages.span--4" className="relative">
        <Avatar data-gc="friends.direct-messages.avatar--2" id={userId} name={nome} url={avatarUrl} size={72} />
        <span data-gc="friends.direct-messages.span--5" className="absolute inset-0 animate-ping rounded-full ring-2 ring-online" />
      </span>

      <p data-gc="friends.direct-messages.p--2" className="text-sm text-ink-muted">
        Chamando <span data-gc="friends.direct-messages.span--6" className="font-semibold text-ink">{nome}</span>…
      </p>

      <button data-gc="friends.direct-messages.button.on-desistir"
        onClick={onDesistir}
        className="flex items-center gap-1.5 rounded-full bg-danger px-4 py-2 text-sm font-medium text-sobre-marca transition hover:brightness-110"
      >
        <PhoneSlash data-gc="friends.direct-messages.phone-slash--2" size={15} weight="fill" /> Cancelar
      </button>
    </div>
  );
};
