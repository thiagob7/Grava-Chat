import React, { type ReactNode } from "react";

import type { Choice } from "~/features/perfil/lib/catalogo";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { OptionsGrid } from "~/features/configuracoes/components/perfil/campos";

interface PickCharmModalProps<T extends string> {
  open: boolean;
  title: string;
  legenda: string;
  options: Choice<T>[];
  value: T;
  onPick: (id: T) => void;
  onClose: () => void;
  sample?: (id: T) => ReactNode;
  preview: ReactNode;
}

export function PickCharmModal<T extends string>({
  open,
  title,
  legenda,
  options,
  value,
  onPick,
  onClose,
  sample,
  preview,
}: PickCharmModalProps<T>) {
  return (
    <Dialog data-gc="perfil.cartao.escolher-enfeite-modal.dialog" open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent data-gc="perfil.cartao.escolher-enfeite-modal.dialog-content" className="max-w-3xl p-5">
        <DialogTitle data-gc="perfil.cartao.escolher-enfeite-modal.dialog-title" className="text-lg font-semibold">{title}</DialogTitle>

        <div data-gc="perfil.cartao.escolher-enfeite-modal.div" className="mt-4 flex gap-5">
          <div data-gc="perfil.cartao.escolher-enfeite-modal.div--2" className="max-h-[26rem] min-w-0 flex-1 overflow-y-auto pr-1">
            <OptionsGrid data-gc="perfil.cartao.escolher-enfeite-modal.options-grid.on-pick"
              label={legenda}
              options={options}
              value={value}
              onPick={onPick}
              sample={sample}
            />
          </div>

          <div data-gc="perfil.cartao.escolher-enfeite-modal.div--3" className="w-80 shrink-0">{preview}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
