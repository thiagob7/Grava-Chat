import React, { useState } from "react";
import { Hash, Lock, MessagesSquare, Volume2 } from "lucide-react";
import type { ChannelType, FonteDeNome } from "@gravae/shared";

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
import { Label, cartaoDeEscolha } from "~/components/ui/input";
import { CampoDeNomeDeCanal } from "~/features/servidor/components/CampoDeNomeDeCanal";
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
  const [fonte, setFonte] = useState<FonteDeNome>("padrao");

  const submit = async () => {
    if (!guildId || !name.trim()) return;

    await createChannel
      .mutateAsync({
        guildId,
        name: name.trim(),
        ...(fonte !== "padrao" ? { fonte } : {}),
        type,
        categoryId,
        isPrivate,
      })
      .catch(() => null);

    setName("");
    setFonte("padrao");
    setIsPrivate(false);
    onClose();
  };

  const Icon = type === "VOICE" ? Volume2 : type === "FORUM" ? MessagesSquare : Hash;

  return (
    <Dialog data-gc="servidor.create-channel-modal.dialog" open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent data-gc="servidor.create-channel-modal.dialog-content">
        <DialogHeader data-gc="servidor.create-channel-modal.dialog-header">
          <DialogTitle data-gc="servidor.create-channel-modal.dialog-title">Criar canal</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="servidor.create-channel-modal.dialog-body">
          <Label data-gc="servidor.create-channel-modal.label">Tipo de canal</Label>
          <div data-gc="servidor.create-channel-modal.div" className="mb-4 space-y-2">
            {CHANNEL_OPTIONS.map((option) => (
              <button data-gc="servidor.create-channel-modal.button"
                key={option.value}
                onClick={() => setType(option.value)}
                className={cartaoDeEscolha(type === option.value)}
              >
                <option.icon data-gc="servidor.create-channel-modal.optionicon" size={20} className="text-ink-faint" />
                <div data-gc="servidor.create-channel-modal.div--2" className="flex-1">
                  <p data-gc="servidor.create-channel-modal.p" className="text-sm font-medium">{option.label}</p>
                  <p data-gc="servidor.create-channel-modal.p--2" className="text-xs text-ink-faint">{option.hint}</p>
                </div>
                <span data-gc="servidor.create-channel-modal.span"
                  className={cn(
                    "size-4 rounded-full border-2",
                    type === option.value ? "border-brand bg-brand" : "border-ink-faint",
                  )}
                />
              </button>
            ))}
          </div>

          <Label data-gc="servidor.create-channel-modal.label--2" htmlFor="channel-name">Nome do canal</Label>
          <CampoDeNomeDeCanal data-gc="servidor.create-channel-modal.campo-de-nome-de-canal.set-name"
            id="channel-name"
            autoFocus
            valor={name}
            onMudar={setName}
            fonte={fonte}
            onFonte={setFonte}
            ehVoz={type !== "TEXT"}
            icone={<Icon data-gc="servidor.create-channel-modal.icon" size={18} className="shrink-0 text-ink-faint" />}
            placeholder={type === "TEXT" ? "novo-canal" : "Sala 2"}
            onEnter={() => void submit()}
          />

          <div data-gc="servidor.create-channel-modal.div--3" className="mt-5 flex items-start gap-4">
            <div data-gc="servidor.create-channel-modal.div--4" className="min-w-0 flex-1">
              <p data-gc="servidor.create-channel-modal.p--3" className="flex items-center gap-1.5 text-sm font-medium">
                <Lock data-gc="servidor.create-channel-modal.lock" size={13} /> Canal privado
              </p>
              <p data-gc="servidor.create-channel-modal.p--4" className="mt-0.5 text-xs text-ink-faint">
                Somente membros e cargos selecionados poderão visualizar esse canal.
              </p>
            </div>
            <Switch data-gc="servidor.create-channel-modal.switch.set-is-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
        </DialogBody>

        <DialogFooter data-gc="servidor.create-channel-modal.dialog-footer">
          <Button data-gc="servidor.create-channel-modal.button.on-close" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button data-gc="servidor.create-channel-modal.button--2" onClick={() => void submit()} disabled={createChannel.isPending || !name.trim()}>
            {createChannel.isPending ? "Criando…" : "Criar canal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
