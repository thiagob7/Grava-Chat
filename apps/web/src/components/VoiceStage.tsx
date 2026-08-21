import React, { useRef } from "react";
import { Mic, MicOff, MonitorUp } from "lucide-react";

import type { Channel, GuildMember, Permission, Role, VoiceState } from "@gravae/shared";

import { useVoiceStore, type VoiceTile } from "~/stores/voice-store";
import { Avatar } from "~/components/Avatar";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/components/VoiceMemberMenu";
import { VoiceStageControls } from "~/components/VoiceStageControls";
import { VoiceVideo } from "~/components/VoiceTrack";
import { cn } from "~/lib/utils";

interface VoiceStageProps {
  channelName: string;
  /** o que o menu do botão direito precisa saber sobre o servidor */
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
  // o alvo da tela cheia é o palco, não a página: a barra lateral não precisa ir junto
  const palco = useRef<HTMLDivElement>(null);
  const tiles = useVoiceStore((s) => s.tiles);
  const connecting = useVoiceStore((s) => s.connecting);
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
    return <div className="flex flex-1 items-center justify-center text-ink-muted">Conectando à chamada…</div>;
  }

  /**
   * Quem está compartilhando tela vira o foco: a tela ocupa o palco e as
   * pessoas ficam numa fileira embaixo, como no Discord.
   */
  const sharing = tiles.find((tile) => tile.screenTrack);

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
      <div ref={palco} className="group relative flex flex-1 flex-col gap-3 bg-surface-2 p-4">
        <div className="relative flex-1 overflow-hidden rounded-lg bg-black">
          <VoiceVideo track={sharing.screenTrack!} />
          <span className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-medium">
            <MonitorUp size={12} className="mr-1 inline" />
            {sharing.name} está compartilhando
          </span>
        </div>
        {/* a fileira ganha margem embaixo pra barra não cobrir os rostos */}
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

  const columns = Math.min(tiles.length <= 1 ? 1 : tiles.length <= 4 ? 2 : 3, 3);

  return (
    <div ref={palco} className="group relative flex flex-1 items-center justify-center bg-surface-2 p-6">
      <div
        className="grid w-full max-w-5xl gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {tiles.map((tile) => (
          <ComMenu key={tile.identity} tile={tile} contexto={contexto}>
            <Tile tile={tile} />
          </ComMenu>
        ))}
      </div>
      {!tiles.length && <p className="text-ink-muted">Ninguém em {channelName} ainda.</p>}

      <VoiceStageControls alvoTelaCheia={palco} />
    </div>
  );
};

interface TileProps {
  tile: VoiceTile;
  compact?: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, compact }) => (
  <div
    className={cn(
      "relative flex items-center justify-center overflow-hidden rounded-lg bg-surface-1 transition",
      compact ? "aspect-video h-full shrink-0" : "aspect-video",
    )}
  >
    {tile.cameraTrack ? (
      // com vídeo não há avatar pra circundar: o anel volta pra borda do quadro
      <div className={cn("size-full", tile.speaking && "ring-2 ring-online")}>
        <VoiceVideo track={tile.cameraTrack} mirrored={tile.isLocal} />
      </div>
    ) : (
      <Avatar
        id={tile.identity}
        name={tile.name}
        url={tile.avatarUrl}
        size={compact ? 40 : 80}
        speaking={tile.speaking}
      />
    )}

    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1">
      {tile.micEnabled ? (
        <Mic size={12} className="text-ink-muted" />
      ) : (
        <MicOff size={12} className="text-danger" />
      )}
      <UserProfilePopover userId={tile.identity} side="top">
        <button className="text-xs font-medium hover:underline">
          {tile.name}
          {tile.isLocal && " (você)"}
        </button>
      </UserProfilePopover>
    </div>
  </div>
);

interface ContextoDoPalco {
  guildId?: string;
  members: GuildMember[];
  roles: Role[];
  canaisDeVoz: Channel[];
  voiceStates: VoiceState[];
  minhasPermissoes: Permission[];
  currentUserId?: string;
}

/**
 * Envolve o quadro no menu do botão direito. Só num servidor: numa DM não há
 * cargo, mover nem mutar — e um menu com tudo desabilitado é pior que menu
 * nenhum.
 */
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
      displayName={tile.name}
      voiceState={contexto.voiceStates.find((v) => v.userId === tile.identity)}
      member={contexto.members.find((m) => m.user.id === tile.identity)}
      roles={contexto.roles}
      canaisDeVoz={contexto.canaisDeVoz}
      minhasPermissoes={contexto.minhasPermissoes}
      currentUserId={contexto.currentUserId}
    >
      <div className={tile.screenTrack ? "contents" : undefined}>{children}</div>
    </VoiceMemberMenu>
  );
};
