import React, { useState } from "react";
import { Hash, Lock, MessagesSquare, Volume2 } from "lucide-react";
import type { ChannelType } from "@gravae/shared";

import { useCreateChannel } from "~/@core/application/queries/guild/use-create-channel";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

interface CreateChannelModalProps {
  open: boolean;
  guildId: string | undefined;
  categoryId: string | null;
  onClose: () => void;
}

const CHANNEL_OPTIONS = [
  {
    value: "TEXT",
    icon: Hash,
    label: "Texto",
    hint: "Envie mensagens, imagens, GIFs, emojis, opiniões e piadas",
  },
  {
    value: "VOICE",
    icon: Volume2,
    label: "Voz",
    hint: "Passe tempo com a turma com voz, vídeo e compartilhamento de tela",
  },
  {
    value: "FORUM",
    icon: MessagesSquare,
    label: "Fórum",
    hint: "Crie um espaço para discussões organizadas",
  },
] as const;

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  open,
  guildId,
  categoryId,
  onClose,
}) => {
  const createChannel = useCreateChannel();
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("TEXT");
  const [isPrivate, setIsPrivate] = useState(false);

  const submit = async () => {
    if (!guildId || !name.trim()) return;

    /**
     * Sem mexer na lista aqui: o canal chega pelo evento `channel:created`,
     * que o servidor manda inclusive pra quem criou.
     */
    await createChannel
      .mutateAsync({ guildId, name: name.trim(), type, categoryId, isPrivate })
      .catch(() => null);

    setName("");
    setIsPrivate(false);
    onClose();
  };

  const Icon = type === "VOICE" ? Volume2 : type === "FORUM" ? MessagesSquare : Hash;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar canal</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <Label>Tipo de canal</Label>
          <div className="mb-4 space-y-2">
            {CHANNEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setType(option.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded px-3 py-2.5 text-left transition",
                  type === option.value ? "bg-surface-4" : "bg-surface-0 hover:bg-surface-4/60",
                )}
              >
                <option.icon size={20} className="text-ink-faint" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-ink-faint">{option.hint}</p>
                </div>
                <span
                  className={cn(
                    "size-4 rounded-full border-2",
                    type === option.value ? "border-brand bg-brand" : "border-ink-faint",
                  )}
                />
              </button>
            ))}
          </div>

          <Label htmlFor="channel-name">Nome do canal</Label>
          <div className="flex items-center gap-2 rounded bg-surface-0 px-3">
            <Icon size={18} className="text-ink-faint" />
            <Input
              id="channel-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s+/g, type === "TEXT" ? "-" : " "))}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder={type === "TEXT" ? "novo-canal" : "Sala 2"}
              maxLength={48}
              className="bg-transparent px-0"
            />
          </div>

          <div className="mt-5 flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Lock size={13} /> Canal privado
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                Somente membros e cargos selecionados poderão visualizar esse canal.
              </p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={createChannel.isPending || !name.trim()}>
            {createChannel.isPending ? "Criando…" : "Criar canal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
