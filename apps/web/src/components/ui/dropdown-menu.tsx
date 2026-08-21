import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";

import { cn } from "~/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-56 rounded-lg bg-surface-0 p-1.5 shadow-2xl outline-none",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
);

interface ItemProps extends React.ComponentProps<typeof DropdownPrimitive.Item> {
  danger?: boolean;
}

export const DropdownMenuItem = ({ className, danger, ...props }: ItemProps) => (
  <DropdownPrimitive.Item
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm outline-none transition",
      danger
        ? "text-danger data-[highlighted]:bg-danger data-[highlighted]:text-white"
        : "text-ink-muted data-[highlighted]:bg-brand data-[highlighted]:text-white",
      className,
    )}
    {...props}
  />
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) => (
  <DropdownPrimitive.Separator className={cn("my-1.5 h-px bg-line", className)} {...props} />
);
