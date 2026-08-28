import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AtSign, Menu, Phone, PhoneOff, UserRound, Video } from "lucide-react";

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
import { cn } from "~/lib/utils";
import { GuildRail } from "~/components/GuildRail";
import { VoiceStage } from "~/components/VoiceStage";
import { PinnedMessagesPanel } from "~/components/PinnedMessagesPanel";
import { PainelDePerfilDoDm } from "~/components/PainelDePerfilDoDm";
import { estaChamando } from "~/lib/chamada-no-privado";
import { tocarSom } from "~/lib/ui-sounds";
import { Tooltip } from "~/components/ui/tooltip";
import { useVoiceStore } from "~/stores/voice-store";
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
  /// a coluna de perfil abre por padrão, como no Discord
  const [perfilAberto, setPerfilAberto] = useState(true);

  /*
    A chamada no privado roda no PRÓPRIO canal da conversa.

    Não existe um canal de voz separado por trás — o servidor aceita emitir
    token de voz para um canal de DM justamente pra não precisar criar (e
    depois limpar) um canal fantasma por conversa. Daí `channelId` da chamada
    ser o mesmo id da conversa aberta.
  */
  const canalEmChamada = useVoiceStore((s) => s.channelId);
  const entrarNaChamada = useVoiceStore((s) => s.join);
  const sairDaChamada = useVoiceStore((s) => s.leave);
  const ligarCamera = useVoiceStore((s) => s.toggleCamera);
  const cameraLigada = useVoiceStore((s) => s.cameraEnabled);
  const emChamadaAqui = Boolean(channelId) && canalEmChamada === channelId;

  /*
    Sozinho na sala de um privado é o telefone tocando do outro lado. Enquanto
    isso, mostrar a grade vazia com o seu próprio quadro não diz nada — quem
    ligou quer saber se a pessoa vai atender, e quer poder desistir.
  */
  const naSala = useVoiceStore((s) => s.tiles.length);
  const chamando = emChamadaAqui && estaChamando({ guildId: null, quantosNaSala: naSala });

  /*
    Ligar com vídeo é a MESMA chamada, com a câmera já aberta — e não um tipo
    diferente de ligação. Discord mostra os dois botões porque a intenção de
    quem clica é diferente; por baixo, os dois entram na mesma sala.
  */
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
        <div className="flex min-w-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
          <header className="regiao-de-arrasto flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4 shadow-sm">
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
                  {emChamadaAqui ? <PhoneOff size={17} /> : <Phone size={17} />}
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
                  <Video size={17} />
                </button>
              </Tooltip>

              {/*
                No privado qualquer um dos dois pode fixar — o serviço só exige
                permissão quando existe servidor por trás, e aqui não existe.
              */}
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
                  <UserRound size={17} />
                </button>
              </Tooltip>
            </div>
          </header>

          {/*
            A chamada fica ACIMA da conversa, e não no lugar dela: o combinado
            no privado é falar e continuar mandando link, print e recado no meio
            — trocar a tela obrigaria a escolher entre as duas coisas.
          */}
          {emChamadaAqui && (
            <div className="flex h-80 shrink-0 flex-col border-b border-divisor">
              {chamando ? (
                <Chamando
                  nome={conversa.user.displayName}
                  userId={conversa.user.id}
                  avatarUrl={conversa.user.avatarUrl}
                  onDesistir={() => void sairDaChamada()}
                />
              ) : (
                <VoiceStage channelName={conversa.user.displayName} currentUserId={user.id} />
              )}
            </div>
          )}

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

        {/*
          A coluna de perfil fica FORA do `main` e não dentro: dentro, ela
          dividiria a altura com a lista de mensagens e o campo de escrever,
          em vez de ficar do lado deles.
        */}
        {perfilAberto && <PainelDePerfilDoDm userId={conversa.user.id} />}
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

/// A cada quanto o "tuut" de espera se repete, pra soar como telefone.
const INTERVALO_DA_ESPERA_MS = 3_000;

/**
 * O que quem liga vê enquanto ninguém atendeu.
 *
 * Sem isto, quem ligava via a grade da chamada com um quadro só — o próprio —
 * e nada indicando que havia alguém sendo chamado. Não dava pra distinguir
 * "estou ligando" de "entrei sozinho num canal vazio".
 */
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
        <PhoneOff size={15} /> Cancelar
      </button>
    </div>
  );
};
