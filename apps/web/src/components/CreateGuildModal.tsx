import React, { useState } from "react";

import { useCreateGuild } from "~/@core/application/queries/guild/use-create-guild";
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

interface CreateGuildModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (guildId: string) => void;
}

export const CreateGuildModal: React.FC<CreateGuildModalProps> = ({ open, onClose, onCreated }) => {
  const createGuild = useCreateGuild();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (name.trim().length < 2) return setError("O nome precisa de pelo menos 2 caracteres");

    setError(null);
    const guild = await createGuild.mutateAsync({ name: name.trim() }).catch(() => null);
    if (!guild) return;

    setName("");
    onClose();
    onCreated(guild.id);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar um servidor</DialogTitle>
          <DialogDescription>
            Seu servidor é onde você e seus amigos conversam. Ele já vem com um canal de texto e um de voz.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Label htmlFor="guild-name">Nome do servidor</Label>
          <Input
            id="guild-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            placeholder="Ex: Gravaê"
            maxLength={64}
          />
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={createGuild.isPending}>
            {createGuild.isPending ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
