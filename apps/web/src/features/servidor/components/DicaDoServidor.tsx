import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { SpeakerHigh } from "@phosphor-icons/react";

import type { VoiceServer } from "@gravae/shared";
import { Avatar } from "~/features/perfil/components/Avatar";
import { CommunitySeal } from "~/features/servidor/components/SeloDaComunidade";

interface ServerPropsHint {
  name: string;
  verified?: boolean;
  detectable?: boolean;
  voices: VoiceServer[];
  children: React.ReactNode;
}

const FACES = 6;

export const ServerHint: React.FC<ServerPropsHint> = ({ name, verified, detectable, voices, children }) => (
  <TooltipPrimitive.Root data-gc="servidor.dica-do-servidor.tooltip-primitiveroot" delayDuration={300}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content data-gc="servidor.dica-do-servidor.tooltip-primitivecontent"
        side="right"
        sideOffset={8}
        className="z-50 max-w-64 rounded-md border border-line bg-surface-4 px-3 py-2.5 shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)]"
      >
        <p data-gc="servidor.dica-do-servidor.p" className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <CommunitySeal data-gc="servidor.dica-do-servidor.community-seal" verified={verified} detectable={detectable} withoutHint />
          <span data-gc="servidor.dica-do-servidor.span" className="truncate">{name}</span>
        </p>

        {voices.map((channel) => (
          <div data-gc="servidor.dica-do-servidor.div" key={channel.channelId} title={channel.channelName} className="mt-2 flex items-center gap-2">
            <SpeakerHigh data-gc="servidor.dica-do-servidor.speaker-high" size={18} weight="fill" className="shrink-0 text-ink-muted" aria-label={channel.channelName} />

            <div data-gc="servidor.dica-do-servidor.div--2" className="flex items-center pl-1.5">
              {channel.people.slice(0, FACES).map((person) => (
                <div data-gc="servidor.dica-do-servidor.div--3" key={person.userId} className="-ml-1.5 rounded-full ring-[3px] ring-surface-4">
                  <Avatar data-gc="servidor.dica-do-servidor.avatar"
                    id={person.userId}
                    name={person.displayName}
                    url={person.avatarUrl}
                    size={26}
                  />
                </div>
              ))}

              {channel.people.length > FACES && (
                <span data-gc="servidor.dica-do-servidor.span--2" className="-ml-1.5 flex size-[26px] items-center justify-center rounded-full bg-surface-3 text-11 font-semibold tabular-nums text-ink-muted ring-[3px] ring-surface-4">
                  +{channel.people.length - FACES}
                </span>
              )}
            </div>
          </div>
        ))}

        <TooltipPrimitive.Arrow data-gc="servidor.dica-do-servidor.tooltip-primitivearrow" width={12} height={6} className="fill-surface-4" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
