import React, { useState } from "react";
import {
  CellSignalLow,
  MicrophoneSlash,
  MonitorArrowUp,
  SpeakerSlash,
  VideoCamera,
} from "@phosphor-icons/react";
import type { Channel, GuildMember, Permission, Role, VoiceState } from "@gravae/shared";
import { has } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { UserProfilePopover } from "~/features/perfil/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/features/voz/components/VoiceMemberMenu";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover";
import { qualityNotice } from "~/features/voz/lib/qualidade-da-conexao";
import { usePanelSound } from "~/features/voz/lib/soundboard";
import { Tooltip } from "~/components/ui/tooltip";
import { BroadcastPreview } from "~/features/voz/components/PreviaDaTransmissao";
import type { Track } from "livekit-client";
import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

interface VoiceMembersProps {
  states: VoiceState[];
  members: GuildMember[];
  guildId?: string;
  roles?: Role[];
  voiceChannels?: Channel[];
  minePermissions?: Permission[];
  currentUserId?: string;
}

export const VoiceMembers: React.FC<VoiceMembersProps> = ({
  states,
  members,
  guildId,
  roles = [],
  voiceChannels = [],
  minePermissions = [],
  currentUserId,
}) => {
  const { t } = useTranslation();
  const tiles = useVoiceStore((s) => s.tiles);
  const sound = usePanelSound((s) => s.who);
  const speaking = new Set(tiles.filter((t) => t.speaking).map((t) => t.identity));

  const channelConnected = useVoiceStore((s) => s.channelId);
  const watch = useVoiceStore((s) => s.watch);
  const watching = useVoiceStore((s) => s.watching);

  const canModerate = has(new Set(minePermissions), "MODERATE_MEMBERS");

  if (!states.length) return null;

  return (
    <div data-gc="voz.voice-members.div" className="mb-1 ml-6 space-y-0.5">
      {states.map((state) => {
        const member = members.find((m) => m.user.id === state.userId);
        const name = member?.nickname ?? member?.user.displayName ?? "…";

        const canWatch =
          state.screenShare && channelConnected === state.channelId && watching !== state.userId;

        const inRoom = tiles.find((t) => t.identity === state.userId);
        const broadcast = inRoom?.screenTrack ?? null;
        const connection = inRoom ? qualityNotice(inRoom.quality) : null;

        const line = (
          <InviteForLive data-gc="voz.voice-members.invite-for-live"
            active={canWatch}
            name={name}
            broadcast={broadcast}
            onWatch={() => watch(state.userId)}
          >
            <UserProfilePopover data-gc="voz.voice-members.user-profile-popover"
              userId={state.userId}
              guildId={guildId}
              roles={roles}
              roleIds={member?.roleIds ?? []}
              canModerate={canModerate}
            >
              <button data-gc="voz.voice-members.button"
                data-gc-usuario={state.userId}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition hover:bg-hover"
              >
                <Avatar data-gc="voz.voice-members.avatar"
                  id={state.userId}
                  name={name}
                  url={member?.user.avatarUrl}
                  size={24}
                  speaking={speaking.has(state.userId) || sound === state.userId}
                />
              <span data-gc="voz.voice-members.span"
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium leading-5",
                  state.selfMute ? "text-ink-faint" : "text-ink-muted",
                )}
              >
                {name}
              </span>
                <span data-gc="voz.voice-members.span--2" className="flex shrink-0 items-center gap-1 text-ink-faint">
                {connection && (
                  <Tooltip data-gc="voz.voice-members.tooltip" label={connection.label}>
                    <span data-gc="voz.voice-members.span--3" className={cn("flex items-center", connection.color)} aria-label={connection.label}>
                      <CellSignalLow data-gc="voz.voice-members.cell-signal-low"
                        size={14}
                        weight="fill"
                        className={connection.pulsing ? "animate-pulse" : undefined}
                      />
                    </span>
                  </Tooltip>
                )}
                {state.screenShare && (
                  <Tooltip data-gc="voz.voice-members.tooltip--2" label={t("chamada.aoVivo")}>
                    <span data-gc="voz.voice-members.span--4"
                      className={cn(flxCls("liveSeal"), "flex items-center text-online")}
                      aria-label={t("chamada.aoVivo")}
                    >
                      <MonitorArrowUp data-gc="voz.voice-members.monitor-arrow-up" size={14} weight="fill" />
                    </span>
                  </Tooltip>
                )}
                {state.camera && <VideoCamera data-gc="voz.voice-members.video-camera" size={14} weight="fill" className="text-online" />}

                {(state.serverMute || state.selfMute) && (
                  <MicrophoneSlash data-gc="voz.voice-members.microphone-slash" size={14} weight="fill" className="text-danger" />
                )}
                {(state.serverDeaf || state.selfDeaf) && (
                  <SpeakerSlash data-gc="voz.voice-members.speaker-slash" size={14} weight="fill" className="text-danger" />
                )}
                </span>
              </button>
            </UserProfilePopover>
          </InviteForLive>
        );

        if (!guildId) return <div data-gc="voz.voice-members.div--2" key={state.userId}>{line}</div>;

        return (
          <VoiceMemberMenu data-gc="voz.voice-members.voice-member-menu"
            key={state.userId}
            guildId={guildId}
            userId={state.userId}
            displayName={name}
            voiceState={state}
            member={member}
            roles={roles}
            voiceChannels={voiceChannels}
            minePermissions={minePermissions}
            currentUserId={currentUserId}
          >
            <div data-gc="voz.voice-members.div--3">{line}</div>
          </VoiceMemberMenu>
        );
      })}
    </div>
  );
};

const InviteForLive: React.FC<{
  active: boolean;
  name: string;
  broadcast: Track | null;
  onWatch: () => void;
  children: React.ReactNode;
}> = ({ active, name, broadcast, onWatch, children }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!active) return <div data-gc="voz.voice-members.div--4">{children}</div>;

  return (
    <Popover data-gc="voz.voice-members.popover.set-is-open" open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor data-gc="voz.voice-members.popover-anchor" asChild>
        <div data-gc="voz.voice-members.div--5" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
          {children}
        </div>
      </PopoverAnchor>

      <PopoverContent data-gc="voz.voice-members.popover-content"
        side="right"
        align="center"
        className="w-64 space-y-2 p-2"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div data-gc="voz.voice-members.div--6" className="relative aspect-video overflow-hidden rounded bg-palco ring-1 ring-line-sutil">
          <div data-gc="voz.voice-members.div--7" className="flex size-full items-center justify-center text-11 text-ink-faint">
            {t("chamada.carregandoPrevia")}
          </div>

          {broadcast && <BroadcastPreview data-gc="voz.voice-members.broadcast-preview" track={broadcast} />}

          <span data-gc="voz.voice-members.span--5" className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-sm bg-danger px-1.5 py-0.5 text-10 font-bold uppercase tracking-wide text-sobre-marca">
            <span data-gc="voz.voice-members.span--6" className="size-1.5 animate-pulse rounded-full bg-sobre-marca" />
            {t("chamada.live.etiquetaMaiuscula")}
          </span>
        </div>

        <button data-gc="voz.voice-members.button--2"
          onClick={() => {
            onWatch();
            setIsOpen(false);
          }}
          className="flex w-full items-center justify-center gap-2 rounded border border-line bg-surface-3 px-2 py-2 text-sm font-medium text-ink transition hover:bg-surface-4"
        >
          <MonitorArrowUp data-gc="voz.voice-members.monitor-arrow-up--2" size={15} weight="fill" className="text-online" />
          {t("chamada.live.assistirPessoa", { nome: name })}
        </button>
      </PopoverContent>
    </Popover>
  );
};
