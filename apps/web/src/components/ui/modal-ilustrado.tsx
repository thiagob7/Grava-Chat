import React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

interface ModalIlustradoProps {
  aberto: boolean;
  onFechar: () => void;
  arte: React.ReactNode;
  titulo: string;
  descricao: React.ReactNode;
  /// Os botões. Ficam empilhados e largos, que é o que funciona embaixo de
  /// uma arte centralizada.
  children: React.ReactNode;
  className?: string;
}

export const ModalIlustrado: React.FC<ModalIlustradoProps> = ({
  aberto,
  onFechar,
  arte,
  titulo,
  descricao,
  children,
  className,
}) => (
  <Dialog data-gc="ui.modal-ilustrado.dialog" open={aberto} onOpenChange={(estado) => !estado && onFechar()}>
    <DialogContent data-gc="ui.modal-ilustrado.dialog-content" className={cn("max-w-sm", className)}>
      <div data-gc="ui.modal-ilustrado.div" className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
        <div data-gc="ui.modal-ilustrado.div--2" className="mb-5">{arte}</div>

        <DialogTitle data-gc="ui.modal-ilustrado.dialog-title" className="text-lg font-bold text-balance">{titulo}</DialogTitle>

        <DialogDescription data-gc="ui.modal-ilustrado.dialog-description" className="mt-2 text-sm text-ink-muted">
          {descricao}
        </DialogDescription>

        <div data-gc="ui.modal-ilustrado.div--3" className="mt-6 flex w-full flex-col gap-2">{children}</div>
      </div>
    </DialogContent>
  </Dialog>
);
