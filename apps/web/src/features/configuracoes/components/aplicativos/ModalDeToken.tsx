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
import { SecretField } from "~/features/configuracoes/components/aplicativos/comum";

interface ModalDeTokenProps {
  token: string | null;
  onClose: () => void;
}

export const ModalDeToken: React.FC<ModalDeTokenProps> = ({ token, onClose }) => (
  <Dialog data-gc="configuracoes.aplicativos.modal-de-token.dialog" open={Boolean(token)} onOpenChange={(state) => !state && onClose()}>
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
          <SecretField data-gc="configuracoes.aplicativos.modal-de-token.secret-field"
            value={token}
            labelCopy="Copiar o token"
            noticeCopied="Token copiado."
          />
        )}
      </DialogBody>

      <DialogFooter data-gc="configuracoes.aplicativos.modal-de-token.dialog-footer">
        <Button data-gc="configuracoes.aplicativos.modal-de-token.button.on-close" onClick={onClose}>Guardei</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
