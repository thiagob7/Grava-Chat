import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { ChevronRight } from "lucide-react";

import { cn } from "~/lib/utils";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuSub = ContextMenuPrimitive.Sub;

export const ContextMenuContent = ({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      className={cn(
        "z-50 max-h-[85vh] min-w-56 overflow-y-auto rounded-lg bg-surface-4 p-1.5 shadow-2xl outline-none",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
);

interface ItemProps extends React.ComponentProps<typeof ContextMenuPrimitive.Item> {
  danger?: boolean;
}

export const ContextMenuItem = ({ className, danger, ...props }: ItemProps) => (
  <ContextMenuPrimitive.Item
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm outline-none transition",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      danger
        ? "text-danger data-[highlighted]:bg-danger data-[highlighted]:text-white"
        : "text-ink-muted data-[highlighted]:bg-brand data-[highlighted]:text-white",
      className,
    )}
    {...props}
  />
);

export const ContextMenuSubTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger>) => (
  <ContextMenuPrimitive.SubTrigger
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm text-ink-muted outline-none transition",
      "data-[highlighted]:bg-brand data-[highlighted]:text-white data-[state=open]:bg-surface-3",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight size={14} />
  </ContextMenuPrimitive.SubTrigger>
);

export const ContextMenuSubContent = ({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.SubContent
      className={cn(
        "z-50 max-h-[70vh] min-w-48 overflow-y-auto rounded-lg bg-surface-4 p-1.5 shadow-2xl outline-none",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
);

export const ContextMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) => (
  <ContextMenuPrimitive.Separator className={cn("my-1.5 h-px bg-line", className)} {...props} />
);

export const ContextMenuLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label>) => (
  <ContextMenuPrimitive.Label
    className={cn("px-2.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint", className)}
    {...props}
  />
);
