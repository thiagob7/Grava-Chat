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

interface ModalDeCriacaoProps {
  aberto: boolean;
  criando: boolean;
  onFechar: () => void;
  onCriar: (nome: string) => void;
}

export const ModalDeCriacao: React.FC<ModalDeCriacaoProps> = ({
  aberto,
  criando,
  onFechar,
  onCriar,
}) => {
  const [nome, setNome] = useState("");

  const valido = nome.trim().length >= 2;

  const criar = () => {
    if (!valido || criando) return;
    onCriar(nome.trim());
  };

  return (
    <Dialog data-gc="configuracoes.aplicativos.modal-de-criacao.dialog"
      open={aberto}
      onOpenChange={(estado) => {
        if (estado) return;
        setNome("");
        onFechar();
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
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && criar()}
            maxLength={32}
            autoFocus
            placeholder="Meu bot"
          />
        </DialogBody>

        <DialogFooter data-gc="configuracoes.aplicativos.modal-de-criacao.dialog-footer">
          <Button data-gc="configuracoes.aplicativos.modal-de-criacao.button.on-fechar" variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>

          <Button data-gc="configuracoes.aplicativos.modal-de-criacao.button.criar" disabled={!valido || criando} onClick={criar}>
            {criando ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
