import React, { type ReactNode } from "react";

import type { Opcao } from "~/features/perfil/lib/catalogo";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { GradeDeOpcoes } from "~/components/user-settings/perfil/campos";

interface EscolherEnfeiteModalProps<T extends string> {
  open: boolean;
  titulo: string;
  legenda: string;
  opcoes: Opcao<T>[];
  valor: T;
  onEscolher: (id: T) => void;
  onClose: () => void;
  amostra?: (id: T) => ReactNode;
  previa: ReactNode;
}

export function EscolherEnfeiteModal<T extends string>({
  open,
  titulo,
  legenda,
  opcoes,
  valor,
  onEscolher,
  onClose,
  amostra,
  previa,
}: EscolherEnfeiteModalProps<T>) {
  return (
    <Dialog open={open} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="max-w-3xl p-5">
        <DialogTitle className="text-lg font-semibold">{titulo}</DialogTitle>

        <div className="mt-4 flex gap-5">
          <div className="max-h-[26rem] min-w-0 flex-1 overflow-y-auto pr-1">
            <GradeDeOpcoes
              label={legenda}
              opcoes={opcoes}
              valor={valor}
              onEscolher={onEscolher}
              amostra={amostra}
            />
          </div>

          <div className="w-80 shrink-0">{previa}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
