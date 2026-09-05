import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { SpeakerHigh } from "@phosphor-icons/react";

import type { VozNoServidor } from "@gravae/shared";
import { Avatar } from "~/features/perfil/components/Avatar";

interface DicaDoServidorProps {
  nome: string;
  vozes: VozNoServidor[];
  children: React.ReactNode;
}

const ROSTOS = 6;

export const DicaDoServidor: React.FC<DicaDoServidorProps> = ({ nome, vozes, children }) => (
  <TooltipPrimitive.Root data-gc="servidor.dica-do-servidor.tooltip-primitiveroot" delayDuration={300}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content data-gc="servidor.dica-do-servidor.tooltip-primitivecontent"
        side="right"
        sideOffset={8}
        className="z-50 max-w-64 rounded-md border border-line bg-surface-4 px-3 py-2.5 shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)]"
      >
        <p data-gc="servidor.dica-do-servidor.p" className="truncate text-sm font-semibold text-ink">{nome}</p>

        {vozes.map((canal) => (
          <div data-gc="servidor.dica-do-servidor.div" key={canal.channelId} className="mt-2.5">
            <p data-gc="servidor.dica-do-servidor.p--2" className="flex items-center gap-1.5 text-xs text-ink-muted">
              <SpeakerHigh data-gc="servidor.dica-do-servidor.speaker-high" size={13} weight="fill" className="shrink-0 text-ink-faint" />
              <span data-gc="servidor.dica-do-servidor.span" className="truncate">{canal.channelName}</span>
            </p>

            <div data-gc="servidor.dica-do-servidor.div--2" className="mt-1.5 flex items-center pl-[3px]">
              {canal.pessoas.slice(0, ROSTOS).map((pessoa) => (
                <div data-gc="servidor.dica-do-servidor.div--3" key={pessoa.userId} className="-ml-[3px] rounded-full ring-2 ring-surface-4">
                  <Avatar data-gc="servidor.dica-do-servidor.avatar"
                    id={pessoa.userId}
                    name={pessoa.displayName}
                    url={pessoa.avatarUrl}
                    size={22}
                  />
                </div>
              ))}

              {canal.pessoas.length > ROSTOS && (
                <span data-gc="servidor.dica-do-servidor.span--2" className="ml-1.5 text-xs tabular-nums text-ink-faint">
                  +{canal.pessoas.length - ROSTOS}
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
