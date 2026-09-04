import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "~/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

export const SheetContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="regiao-sem-arrasto fixed inset-0 z-50 bg-black/60" />
    <DialogPrimitive.Content
      className={cn(
        "regiao-sem-arrasto fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface-2 shadow-2xl outline-none",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const SheetCloseButton = ({ className }: { className?: string }) => (
  <DialogPrimitive.Close
    aria-label="Fechar"
    className={cn("shrink-0 rounded p-1 text-ink-faint transition hover:text-ink", className)}
  >
    <X size={20} />
  </DialogPrimitive.Close>
);
