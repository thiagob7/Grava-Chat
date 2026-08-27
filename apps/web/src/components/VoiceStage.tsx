import React, { useEffect, useRef, useState } from "react";
import { Maximize, Mic, MicOff, Minimize, MonitorUp, Play, X } from "lucide-react";

import type {
  Channel,
  GuildMember,
  Permission,
  Role,
  VoiceState,
} from "@gravae/shared";

import { useVoiceStore, type VoiceTile } from "~/stores/voice-store";
import { Avatar } from "~/components/Avatar";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/components/VoiceMemberMenu";
import { VoiceStageControls } from "~/components/VoiceStageControls";
import { VoiceVideo } from "~/components/VoiceTrack";
import { useParticipante } from "~/hooks/use-participante";
import { cn } from "~/lib/utils";

interface VoiceStageProps {
  channelName: string;
  guildId?: string;
  members?: GuildMember[];
  roles?: Role[];
  canaisDeVoz?: Channel[];
  voiceStates?: VoiceState[];
  minhasPermissoes?: Permission[];
  currentUserId?: string;
}

export const VoiceStage: React.FC<VoiceStageProps> = ({
  channelName,
  guildId,
  members = [],
  roles = [],
  canaisDeVoz = [],
  voiceStates = [],
  minhasPermissoes = [],
  currentUserId,
}) => {
  const palco = useRef<HTMLDivElement>(null);
  const quadro = useRef<HTMLDivElement>(null);
  const [telaCheia, setTelaCheia] = useState(false);

  /*
    Tela cheia no QUADRO, não na janela inteira: assim a barra de participantes
    e o resto do app somem, e o vídeo ocupa o monitor.

    O estado vem do evento do navegador, nunca do clique — sair com Esc não
    passa pelo nosso botão, e sem escutar o evento o ícone ficaria mentindo.
  */
  useEffect(() => {
    const sincronizar = () => setTelaCheia(document.fullscreenElement === quadro.current);

    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  const alternarTelaCheia = () => {
    if (document.fullscreenElement) return void document.exitFullscreen().catch(() => undefined);

    void quadro.current?.requestFullscreen().catch(() => undefined);
  };
  const tiles = useVoiceStore((s) => s.tiles);
  const connecting = useVoiceStore((s) => s.connecting);

  const assistindo = useVoiceStore((s) => s.assistindo);
  const setAssistindo = useVoiceStore((s) => s.assistir);
  const definirPalcoVisivel = useVoiceStore((s) => s.definirPalcoVisivel);

  useEffect(() => {
    definirPalcoVisivel(true);
    return () => definirPalcoVisivel(false);
  }, [definirPalcoVisivel]);
  const error = useVoiceStore((s) => s.error);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="font-medium text-danger">Não deu pra entrar na chamada</p>
        <p className="max-w-sm text-sm text-ink-muted">{error}</p>
      </div>
    );
  }

  if (connecting) {
    return (
      <div className="flex flex-1 items-center justify-center text-ink-muted">
        Conectando à chamada…
      </div>
    );
  }

  const sharing = assistindo
    ? tiles.find((t) => t.identity === assistindo && t.screenTrack)
    : null;

  const contexto = {
    guildId,
    members,
    roles,
    canaisDeVoz,
    voiceStates,
    minhasPermissoes,
    currentUserId,
  };

  if (sharing) {
    return (
      <div
        ref={palco}
        className="group relative flex flex-1 flex-col gap-3 bg-surface-2 p-4"
      >
        <div ref={quadro} className="relative flex-1 overflow-hidden rounded-lg bg-black">
          <VoiceVideo track={sharing.screenTrack!} />

          {/*
            Duas faixas sobre o vídeo, como no Discord: quem transmite em cima,
            controles embaixo. Ficam DENTRO do quadro de propósito — em tela
            cheia elas vão junto, e é justamente aí que se precisa delas.

            O degradê existe pra legibilidade: texto branco sobre imagem clara
            some, e uma barra sólida comeria pedaço do vídeo.
          */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/80 to-transparent px-4 pb-8 pt-3">
            <span className="text-sm font-medium">{sharing.name}</span>
            <span className="text-sm text-white/60">está transmitindo</span>

            <span className="ml-auto rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
              AO VIVO
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
            <div className="flex shrink-0 gap-2">
              {tiles.map((tile) => (
                <ComMenu key={tile.identity} tile={tile} contexto={contexto}>
                  <Tile tile={tile} compact />
                </ComMenu>
              ))}
            </div>

            <button
              onClick={() => setAssistindo(null)}
              className="mx-auto flex items-center gap-1.5 rounded bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm transition hover:bg-white/25"
            >
              <X size={14} /> Parar de assistir
            </button>

            <button
              onClick={alternarTelaCheia}
              aria-label={telaCheia ? "Sair da tela cheia" : "Tela cheia"}
              title={telaCheia ? "Sair da tela cheia (Esc)" : "Tela cheia"}
              className="shrink-0 rounded p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              {telaCheia ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>

        <VoiceStageControls alvoTelaCheia={palco} />
      </div>
    );
  }

  const columns = Math.min(
    tiles.length <= 1 ? 1 : tiles.length <= 4 ? 2 : 3,
    3,
  );

  return (
    <div
      ref={palco}
      className="group relative flex flex-1 items-center justify-center bg-surface-2 p-6"
    >
      <div
        className="grid w-full max-w-5xl gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile) => (
          <ComMenu key={tile.identity} tile={tile} contexto={contexto}>
            <Tile tile={tile} onAssistir={() => setAssistindo(tile.identity)} />
          </ComMenu>
        ))}
      </div>
      {!tiles.length && (
        <p className="text-ink-muted">Ninguém em {channelName} ainda.</p>
      )}

      <VoiceStageControls alvoTelaCheia={palco} />
    </div>
  );
};

interface TileProps {
  tile: VoiceTile;
  compact?: boolean;
  onAssistir?: () => void;
}

const Tile: React.FC<TileProps> = ({ tile, compact, onAssistir }) => {
  const resolver = useParticipante();
  const participante = resolver(tile.identity, {
    name: tile.name,
    avatarUrl: tile.avatarUrl,
  });

  return (
    <div
      className={cn(
        "group/tile relative flex items-center justify-center overflow-hidden rounded-lg bg-surface-1 transition",
        compact ? "aspect-video h-full shrink-0" : "aspect-video",
      )}
    >
      {tile.screenTrack && onAssistir && (
        <button
          onClick={onAssistir}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 transition hover:bg-black/60"
        >
          <span className="flex items-center gap-1.5 rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-white" /> Ao
            vivo
          </span>
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Play size={16} /> Assistir{" "}
            {tile.isLocal ? "sua transmissão" : `a ${tile.name}`}
          </span>
        </button>
      )}

      {tile.cameraTrack ? (
        <div className={cn("size-full", tile.speaking && "ring-2 ring-online")}>
          <VoiceVideo track={tile.cameraTrack} mirrored={tile.isLocal} />
        </div>
      ) : (
        <Avatar
          id={tile.identity}
          name={participante.nome}
          url={participante.avatarUrl}
          size={compact ? 40 : 80}
          enfeites={participante.perfil}
          animar={tile.speaking}
        />
      )}

      {/*
        A etiqueta é limitada à largura do quadro e nunca quebra linha: sem isso,
        num quadro pequeno o nome envolvia em duas linhas e subia por cima do
        avatar. Nome comprido agora é cortado com reticências.
      */}
      <div
        className={cn(
          "absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-0.75rem)] items-center gap-1 rounded bg-black/60 px-1.5 py-0.5",
          !compact && "bottom-2 left-2 gap-1.5 px-2 py-1",
        )}
      >
        {tile.micEnabled ? (
          <Mic size={12} className="shrink-0 text-ink-muted" />
        ) : (
          <MicOff size={12} className="shrink-0 text-danger" />
        )}
        <UserProfilePopover userId={tile.identity} side="top">
          <button
            className={cn(
              "min-w-0 truncate whitespace-nowrap font-medium hover:underline",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {participante.nome}
            {tile.isLocal && " (você)"}
          </button>
        </UserProfilePopover>
      </div>
    </div>
  );
};

interface ContextoDoPalco {
  guildId?: string;
  members: GuildMember[];
  roles: Role[];
  canaisDeVoz: Channel[];
  voiceStates: VoiceState[];
  minhasPermissoes: Permission[];
  currentUserId?: string;
}

const ComMenu: React.FC<{
  tile: VoiceTile;
  contexto: ContextoDoPalco;
  children: React.ReactNode;
}> = ({ tile, contexto, children }) => {
  if (!contexto.guildId) return <>{children}</>;

  return (
    <VoiceMemberMenu
      guildId={contexto.guildId}
      userId={tile.identity}
      displayName={
        contexto.members.find((m) => m.user.id === tile.identity)?.user.displayName ?? tile.name
      }
      voiceState={contexto.voiceStates.find((v) => v.userId === tile.identity)}
      member={contexto.members.find((m) => m.user.id === tile.identity)}
      roles={contexto.roles}
      canaisDeVoz={contexto.canaisDeVoz}
      minhasPermissoes={contexto.minhasPermissoes}
      currentUserId={contexto.currentUserId}
    >
      <div className={tile.screenTrack ? "contents" : undefined}>
        {children}
      </div>
    </VoiceMemberMenu>
  );
};
