import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

interface IllustratedModalProps {
  open: boolean;
  onClose: () => void;
  art: React.ReactNode;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const IllustratedModal: React.FC<IllustratedModalProps> = ({
  open,
  onClose,
  art,
  title,
  description,
  children,
  className,
}) => (
  <Dialog data-gc="ui.illustrated-modal.dialog" open={open} onOpenChange={(state) => !state && onClose()}>
    <DialogContent data-gc="ui.illustrated-modal.dialog-content" className={cn("max-w-sm", className)}>
      <div data-gc="ui.illustrated-modal.div" className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
        <div data-gc="ui.illustrated-modal.div--2" className="mb-5">{art}</div>

        <DialogTitle data-gc="ui.illustrated-modal.dialog-title" className="text-lg font-bold text-balance">{title}</DialogTitle>

        <DialogDescription data-gc="ui.illustrated-modal.dialog-description" className="mt-2 text-sm text-ink-muted">
          {description}
        </DialogDescription>

        <div data-gc="ui.illustrated-modal.div--3" className="mt-6 flex w-full flex-col gap-2">{children}</div>
      </div>
    </DialogContent>
  </Dialog>
);
