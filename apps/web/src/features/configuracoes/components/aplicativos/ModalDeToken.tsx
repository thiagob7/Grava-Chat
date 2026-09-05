import React from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { CampoDeSegredo } from "~/features/configuracoes/components/aplicativos/comum";

interface ModalDeTokenProps {
  token: string | null;
  onFechar: () => void;
}

export const ModalDeToken: React.FC<ModalDeTokenProps> = ({ token, onFechar }) => (
  <Dialog open={Boolean(token)} onOpenChange={(estado) => !estado && onFechar()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TriangleAlert size={18} className="text-aviso" />
          Copie o token agora
        </DialogTitle>
        <DialogDescription>
          Ele não aparece de novo. Se perder, só resta gerar outro — e o antigo
          morre na hora.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        {token && (
          <CampoDeSegredo
            valor={token}
            rotuloCopiar="Copiar o token"
            avisoCopiado="Token copiado."
          />
        )}
      </DialogBody>

      <DialogFooter>
        <Button onClick={onFechar}>Guardei</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
