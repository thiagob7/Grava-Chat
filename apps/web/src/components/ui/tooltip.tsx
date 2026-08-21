import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "~/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = ({
  children,
  label,
  side = "top",
}: {
  children: React.ReactNode;
  label: string;
  side?: "top" | "right" | "bottom" | "left";
}) => (
  <TooltipPrimitive.Root delayDuration={300}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className={cn(
          "z-50 rounded bg-surface-0 px-2.5 py-1.5 text-xs font-medium text-ink shadow-lg",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0",
        )}
      >
        {label}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
