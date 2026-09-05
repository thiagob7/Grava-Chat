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
    <Dialog
      open={aberto}
      onOpenChange={(estado) => {
        if (estado) return;
        setNome("");
        onFechar();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar aplicativo</DialogTitle>
          <DialogDescription>
            O bot nasce junto, com esse nome. Dá pra trocar depois.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Label htmlFor="nome-do-aplicativo">Nome</Label>
          <Input
            id="nome-do-aplicativo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && criar()}
            maxLength={32}
            autoFocus
            placeholder="Meu bot"
          />
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onFechar}>
            Cancelar
          </Button>

          <Button disabled={!valido || criando} onClick={criar}>
            {criando ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
