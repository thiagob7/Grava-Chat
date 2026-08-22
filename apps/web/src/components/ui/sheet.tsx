import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "~/lib/utils";

/**
 * Gaveta lateral.
 *
 * É o mesmo Radix Dialog do `dialog.tsx` — muda só onde ela encosta e como
 * entra. Reaproveitar em vez de escrever do zero traz de graça o que é chato e
 * fácil de errar: foco preso dentro, Esc, clique fora, `aria-modal` e o
 * retorno do foco pro gatilho ao fechar.
 */
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
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface-2 shadow-2xl outline-none",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

/** O X fica solto: cada gaveta decide onde ele encaixa no próprio cabeçalho. */
export const SheetCloseButton = ({ className }: { className?: string }) => (
  <DialogPrimitive.Close
    aria-label="Fechar"
    className={cn("shrink-0 rounded p-1 text-ink-faint transition hover:text-ink", className)}
  >
    <X size={20} />
  </DialogPrimitive.Close>
);
