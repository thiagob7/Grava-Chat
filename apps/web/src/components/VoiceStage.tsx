import React, { useEffect, useRef } from "react";
import { Mic, MicOff, MonitorUp, Play, X } from "lucide-react";

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
        <div className="relative flex-1 overflow-hidden rounded-lg bg-black">
          <VoiceVideo track={sharing.screenTrack!} />
          <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-medium">
            <MonitorUp size={12} className="mr-1 inline" />
            {sharing.name} está compartilhando
          </span>

          <button
            onClick={() => setAssistindo(null)}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded bg-black/70 px-2.5 py-1.5 text-xs font-medium transition hover:bg-black/90"
          >
            <X size={14} /> Parar de assistir
          </button>
        </div>
        <div className="flex h-24 shrink-0 gap-3 overflow-x-auto pb-14">
          {tiles.map((tile) => (
            <ComMenu key={tile.identity} tile={tile} contexto={contexto}>
              <Tile tile={tile} compact />
            </ComMenu>
          ))}
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
