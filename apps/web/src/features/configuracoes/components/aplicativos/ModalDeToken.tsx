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
  <Dialog data-gc="configuracoes.aplicativos.modal-de-token.dialog" open={Boolean(token)} onOpenChange={(estado) => !estado && onFechar()}>
    <DialogContent data-gc="configuracoes.aplicativos.modal-de-token.dialog-content">
      <DialogHeader data-gc="configuracoes.aplicativos.modal-de-token.dialog-header">
        <DialogTitle data-gc="configuracoes.aplicativos.modal-de-token.dialog-title" className="flex items-center gap-2">
          <TriangleAlert data-gc="configuracoes.aplicativos.modal-de-token.triangle-alert" size={18} className="text-aviso" />
          Copie o token agora
        </DialogTitle>
        <DialogDescription data-gc="configuracoes.aplicativos.modal-de-token.dialog-description">
          Ele não aparece de novo. Se perder, só resta gerar outro — e o antigo
          morre na hora.
        </DialogDescription>
      </DialogHeader>

      <DialogBody data-gc="configuracoes.aplicativos.modal-de-token.dialog-body">
        {token && (
          <CampoDeSegredo data-gc="configuracoes.aplicativos.modal-de-token.campo-de-segredo"
            valor={token}
            rotuloCopiar="Copiar o token"
            avisoCopiado="Token copiado."
          />
        )}
      </DialogBody>

      <DialogFooter data-gc="configuracoes.aplicativos.modal-de-token.dialog-footer">
        <Button data-gc="configuracoes.aplicativos.modal-de-token.button.on-fechar" onClick={onFechar}>Guardei</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
