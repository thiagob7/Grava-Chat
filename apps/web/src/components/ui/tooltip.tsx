import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { DesenhoDaSeta } from "~/components/ui/seta-do-balao";
import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-fluxer";

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = ({
  children,
  label,
  atalho,
  side = "top",
}: {
  children: React.ReactNode;
  label: string;
  atalho?: string[];
  side?: "top" | "right" | "bottom" | "left";
}) => (
  <TooltipPrimitive.Root data-gc="ui.tooltip.tooltip-primitiveroot" delayDuration={300}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content data-gc="ui.tooltip.tooltip-primitivecontent"
        side={side}
        sideOffset={6}
        className={cn(
          "dica z-50 rounded-md border border-line bg-surface-4 px-2.5 py-[7px] text-xs font-medium text-ink",
          flxCls("dica"),
          "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)]",
        )}
      >
        {atalho ? (
          /*
            Rótulo em cima, teclas embaixo. Em linha, uma dica com atalho fica
            larga demais e o texto some do canto da tela.
          */
          <span data-gc="ui.tooltip.span" className="flex flex-col items-center gap-1.5">
            {label}
            <span data-gc="ui.tooltip.span--2" className="flex items-center gap-1">
              {atalho.map((tecla) => (
                <kbd data-gc="ui.tooltip.kbd"
                  key={tecla}
                  className="rounded border border-white/10 bg-surface-3 px-1.5 py-0.5 text-10 font-semibold uppercase text-ink-muted"
                >
                  {tecla}
                </kbd>
              ))}
            </span>
          </span>
        ) : (
          label
        )}

        <TooltipPrimitive.Arrow data-gc="ui.tooltip.tooltip-primitivearrow" asChild width={12} height={6}>
          <svg data-gc="ui.tooltip.svg" className="overflow-visible">
            <DesenhoDaSeta data-gc="ui.tooltip.desenho-da-seta" />
          </svg>
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
