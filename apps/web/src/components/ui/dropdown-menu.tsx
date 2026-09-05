import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";

import { Check, ChevronRight } from "lucide-react";

import { cn } from "~/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content data-gc="ui.dropdown-menu.dropdown-primitivecontent"
      sideOffset={sideOffset}
      className={cn(
        "regiao-sem-arrasto z-50 min-w-56 rounded-lg bg-surface-4 p-1.5 shadow-2xl outline-none",
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
  <DropdownPrimitive.Item data-gc="ui.dropdown-menu.dropdown-primitiveitem"
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

export const DropdownMenuLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Label>) => (
  <DropdownPrimitive.Label data-gc="ui.dropdown-menu.dropdown-primitivelabel"
    className={cn("px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint", className)}
    {...props}
  />
);

export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export const DropdownMenuRadioItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.RadioItem>) => (
  <DropdownPrimitive.RadioItem data-gc="ui.dropdown-menu.dropdown-primitiveradio-item"
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm text-ink-muted outline-none transition",
      "data-[highlighted]:bg-brand data-[highlighted]:text-white data-[state=checked]:text-ink",
      className,
    )}
    {...props}
  >
    <span data-gc="ui.dropdown-menu.span" className="min-w-0 flex-1 truncate">{children}</span>

    <span data-gc="ui.dropdown-menu.span--2" className="flex size-4 shrink-0 items-center justify-center rounded-full border border-ink-faint">
      <DropdownPrimitive.ItemIndicator data-gc="ui.dropdown-menu.dropdown-primitiveitem-indicator">
        <span data-gc="ui.dropdown-menu.span--3" className="block size-2 rounded-full bg-brand" />
      </DropdownPrimitive.ItemIndicator>
    </span>
  </DropdownPrimitive.RadioItem>
);

export const DropdownMenuCheckboxItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.CheckboxItem>) => (
  <DropdownPrimitive.CheckboxItem data-gc="ui.dropdown-menu.dropdown-primitivecheckbox-item"
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm text-ink-muted outline-none transition",
      "data-[highlighted]:bg-brand data-[highlighted]:text-white data-[state=checked]:text-ink",
      className,
    )}
    {...props}
  >
    <span data-gc="ui.dropdown-menu.span--4" className="min-w-0 flex-1 truncate">{children}</span>

    <span data-gc="ui.dropdown-menu.span--5" className="flex size-4 shrink-0 items-center justify-center rounded border border-ink-faint">
      <DropdownPrimitive.ItemIndicator data-gc="ui.dropdown-menu.dropdown-primitiveitem-indicator--2">
        <Check data-gc="ui.dropdown-menu.check" size={12} />
      </DropdownPrimitive.ItemIndicator>
    </span>
  </DropdownPrimitive.CheckboxItem>
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) => (
  <DropdownPrimitive.Separator data-gc="ui.dropdown-menu.dropdown-primitiveseparator" className={cn("my-1.5 h-px bg-line", className)} {...props} />
);

export const DropdownMenuSub = DropdownPrimitive.Sub;

export const DropdownMenuSubTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.SubTrigger>) => (
  <DropdownPrimitive.SubTrigger data-gc="ui.dropdown-menu.dropdown-primitivesub-trigger"
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm text-ink-muted outline-none transition",
      "data-[highlighted]:bg-brand data-[highlighted]:text-white data-[state=open]:bg-surface-3",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight data-gc="ui.dropdown-menu.chevron-right" size={14} />
  </DropdownPrimitive.SubTrigger>
);

export const DropdownMenuSubContent = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.SubContent>) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.SubContent data-gc="ui.dropdown-menu.dropdown-primitivesub-content"
      className={cn(
        "regiao-sem-arrasto z-50 max-h-[70vh] min-w-48 overflow-y-auto rounded-lg bg-surface-4 p-1.5 shadow-2xl outline-none",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
);
