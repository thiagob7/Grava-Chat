import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "~/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay data-gc="ui.dialog.dialog-primitiveoverlay" className="regiao-sem-arrasto fixed inset-0 z-50 bg-black/35 backdrop-blur-[3px]" />
    <DialogPrimitive.Content data-gc="ui.dialog.dialog-primitivecontent"
      className={cn(
        "regiao-sem-arrasto fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-full max-w-md outline-none",
        "rounded-xl border border-line bg-surface-1",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_0.25rem_0.75rem_-0.25rem_rgba(0,0,0,0.14),0_0.75rem_2rem_-0.75rem_rgba(0,0,0,0.12)]",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Fechar"
        className="absolute right-5 top-4 text-ink-faint transition hover:text-ink"
      >
        <X data-gc="ui.dialog.x" size={20} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogHeader = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-gc="ui.dialog.div" className={cn("border-b border-line px-5 py-4", className)} {...props} />
);

export const DialogTitle = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title data-gc="ui.dialog.dialog-primitivetitle" className={cn("text-lg font-semibold", className)} {...props} />
);

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description data-gc="ui.dialog.dialog-primitivedescription" className={cn("mt-1 text-sm text-ink-muted", className)} {...props} />
);

export const DialogBody = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-gc="ui.dialog.div--2" className={cn("p-5", className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-gc="ui.dialog.div--3" className={cn("flex justify-end gap-2 px-5 pb-5", className)} {...props} />
);
