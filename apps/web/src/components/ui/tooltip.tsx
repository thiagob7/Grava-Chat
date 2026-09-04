import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { DesenhoDaSeta } from "~/components/ui/seta-do-balao";
import { cn } from "~/lib/utils";

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
  <TooltipPrimitive.Root delayDuration={300}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className={cn(
          "z-50 rounded-md border border-line bg-surface-4 px-2.5 py-[7px] text-xs font-medium text-ink",
          "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)]",
        )}
      >
        {atalho ? (
          <span className="flex items-center gap-2">
            {label}
            <span className="flex items-center gap-1">
              {atalho.map((tecla) => (
                <kbd
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

        <TooltipPrimitive.Arrow asChild width={12} height={6}>
          <svg className="overflow-visible">
            <DesenhoDaSeta />
          </svg>
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
