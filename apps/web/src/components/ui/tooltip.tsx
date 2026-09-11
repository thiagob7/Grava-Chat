import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { ArrowShape } from "~/components/ui/bubble-arrow";
import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = ({
  children,
  label,
  shortcut,
  side = "top",
  className,
  onOpenChange,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  shortcut?: string[];
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
}) => (
  <TooltipPrimitive.Root data-gc="ui.tooltip.tooltip-primitiveroot.on-open-change" delayDuration={300} onOpenChange={onOpenChange}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content data-gc="ui.tooltip.tooltip-primitivecontent"
        side={side}
        sideOffset={6}
        collisionPadding={{ top: 40, right: 8, bottom: 8, left: 8 }}
        className={cn(
          "dica z-50 rounded-md border border-line bg-surface-4 px-2.5 py-[7px] text-xs font-medium text-ink",
          flxCls("hint"),
          "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)]",
          className,
        )}
      >
        {shortcut ? (
          <span data-gc="ui.tooltip.span" className="flex flex-col items-center gap-1.5">
            {label}
            <span data-gc="ui.tooltip.span--2" className="flex items-center gap-1">
              {shortcut.map((key) => (
                <kbd data-gc="ui.tooltip.kbd"
                  key={key}
                  className="rounded border border-line-sutil bg-surface-3 px-1.5 py-0.5 text-10 font-semibold uppercase text-ink-muted"
                >
                  {key}
                </kbd>
              ))}
            </span>
          </span>
        ) : (
          label
        )}

        <TooltipPrimitive.Arrow data-gc="ui.tooltip.tooltip-primitivearrow" asChild width={12} height={6}>
          <svg data-gc="ui.tooltip.svg" className="overflow-visible">
            <ArrowShape data-gc="ui.tooltip.arrow-shape" />
          </svg>
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
