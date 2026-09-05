import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { DesenhoDaSeta } from "~/components/ui/seta-do-balao";
import { cn } from "~/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverArrow = ({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) => (
  <PopoverPrimitive.Arrow data-gc="ui.popover.popover-primitivearrow" asChild width={14} height={7} {...props}>
    <svg data-gc="ui.popover.svg" className={cn("overflow-visible", className)}>
      <DesenhoDaSeta data-gc="ui.popover.desenho-da-seta" />
    </svg>
  </PopoverPrimitive.Arrow>
);

export const PopoverContent = ({
  className,
  align = "start",
  sideOffset = 8,
  portal = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & { portal?: boolean }) => {
  const conteudo = (
    <PopoverPrimitive.Content data-gc="ui.popover.popover-primitivecontent"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "regiao-sem-arrasto z-50 w-72 rounded-lg border border-line bg-surface-4 p-4 shadow-2xl outline-none",
        className,
      )}
      {...props}
    />
  );

  return portal ? <PopoverPrimitive.Portal>{conteudo}</PopoverPrimitive.Portal> : conteudo;
};
