import React, { useState } from "react";

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
import { Input, Label } from "~/components/ui/input";

interface CreationPropsModal {
  isOpen: boolean;
  creating: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export const CreationModal: React.FC<CreationPropsModal> = ({
  isOpen,
  creating,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");

  const valid = name.trim().length >= 2;

  const create = () => {
    if (!valid || creating) return;
    onCreate(name.trim());
  };

  return (
    <Dialog data-gc="configuracoes.aplicativos.modal-de-criacao.dialog"
      open={isOpen}
      onOpenChange={(state) => {
        if (state) return;
        setName("");
        onClose();
      }}
    >
      <DialogContent data-gc="configuracoes.aplicativos.modal-de-criacao.dialog-content">
        <DialogHeader data-gc="configuracoes.aplicativos.modal-de-criacao.dialog-header">
          <DialogTitle data-gc="configuracoes.aplicativos.modal-de-criacao.dialog-title">Criar aplicativo</DialogTitle>
          <DialogDescription data-gc="configuracoes.aplicativos.modal-de-criacao.dialog-description">
            O bot nasce junto, com esse nome. Dá pra trocar depois.
          </DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="configuracoes.aplicativos.modal-de-criacao.dialog-body">
          <Label data-gc="configuracoes.aplicativos.modal-de-criacao.label" htmlFor="nome-do-aplicativo">Nome</Label>
          <Input data-gc="configuracoes.aplicativos.modal-de-criacao.input"
            id="nome-do-aplicativo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            maxLength={32}
            autoFocus
            placeholder="Meu bot"
          />
        </DialogBody>

        <DialogFooter data-gc="configuracoes.aplicativos.modal-de-criacao.dialog-footer">
          <Button data-gc="configuracoes.aplicativos.modal-de-criacao.button.on-close" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>

          <Button data-gc="configuracoes.aplicativos.modal-de-criacao.button.create" disabled={!valid || creating} onClick={create}>
            {creating ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
