import React from "react";
import { Mic, MicOff, MonitorUp, Video } from "lucide-react";
import type { Channel, GuildMember, Permission, Role, VoiceState } from "@gravae/shared";

import { Avatar } from "~/components/Avatar";
import { UserProfilePopover } from "~/components/UserProfilePopover";
import { VoiceMemberMenu } from "~/components/VoiceMemberMenu";
import { useVoiceStore } from "~/stores/voice-store";
import { cn } from "~/lib/utils";

interface VoiceMembersProps {
  states: VoiceState[];
  members: GuildMember[];
  guildId?: string;
  roles?: Role[];
  canaisDeVoz?: Channel[];
  minhasPermissoes?: Permission[];
  currentUserId?: string;
}

export const VoiceMembers: React.FC<VoiceMembersProps> = ({
  states,
  members,
  guildId,
  roles = [],
  canaisDeVoz = [],
  minhasPermissoes = [],
  currentUserId,
}) => {
  const tiles = useVoiceStore((s) => s.tiles);
  const falando = new Set(tiles.filter((t) => t.speaking).map((t) => t.identity));

  if (!states.length) return null;

  return (
    <div className="mb-1 ml-6 space-y-0.5">
      {states.map((state) => {
        const member = members.find((m) => m.user.id === state.userId);
        const name = member?.nickname ?? member?.user.displayName ?? "…";

        const linha = (
          <UserProfilePopover userId={state.userId}>
            <button className="flex w-full items-center gap-2 rounded px-2 py-1 text-left transition hover:bg-surface-3">
              <Avatar
                id={state.userId}
                name={name}
                url={member?.user.avatarUrl}
                size={24}
                speaking={falando.has(state.userId)}
              />
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                state.selfMute ? "text-ink-faint" : "text-ink-muted",
              )}
            >
              {name}
            </span>
              <span className="flex shrink-0 items-center gap-1 text-ink-faint">
              {state.screenShare && <MonitorUp size={13} className="text-online" />}
              {state.camera && <Video size={13} className="text-online" />}
              {state.serverMute ? (
                <MicOff size={13} className="text-danger" />
              ) : state.selfMute ? (
                <MicOff size={13} className="text-danger" />
              ) : (
                <Mic size={13} />
              )}
              </span>
            </button>
          </UserProfilePopover>
        );

        if (!guildId) return <div key={state.userId}>{linha}</div>;

        return (
          <VoiceMemberMenu
            key={state.userId}
            guildId={guildId}
            userId={state.userId}
            displayName={name}
            voiceState={state}
            member={member}
            roles={roles}
            canaisDeVoz={canaisDeVoz}
            minhasPermissoes={minhasPermissoes}
            currentUserId={currentUserId}
          >
            <div>{linha}</div>
          </VoiceMemberMenu>
        );
      })}
    </div>
  );
};
