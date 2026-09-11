import React, { useState } from "react";
import { Hash, Link2, Lock, MessagesSquare, Volume2 } from "lucide-react";
import type { ChannelType, NameFont } from "@gravae/shared";

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
import { Input, Label, choiceCard } from "~/components/ui/input";
import { NameChannelField } from "~/features/servidor/components/CampoDeNomeDeCanal";
import { Switch } from "~/components/ui/switch";

import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

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
  {
    value: "LINK",
    icon: Link2,
    label: "servidor.canal.tipoLink",
    hint: "servidor.canal.tipoLinkDica",
  },
] as const;

const isAddress = (value: string) => /^https:\/\/[^\s]+\.[^\s]+$/.test(value.trim());

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  open,
  guildId,
  categoryId,
  onClose,
}) => {
  const { t } = useTranslation();
  const createChannel = useCreateChannel();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<ChannelType>("TEXT");
  const [isPrivate, setIsPrivate] = useState(false);
  const [font, setFont] = useState<NameFont>("padrao");

  const submit = async () => {
    if (!guildId || !name.trim()) return;
    if (type === "LINK" && !isAddress(url)) return;

    await createChannel
      .mutateAsync({
        guildId,
        name: name.trim(),
        ...(font !== "padrao" ? { font } : {}),
        type,
        ...(type === "LINK" ? { url: url.trim() } : {}),
        categoryId,
        isPrivate,
      })
      .catch(() => null);

    setName("");
    setUrl("");
    setFont("padrao");
    setIsPrivate(false);
    onClose();
  };

  const Icon =
    type === "VOICE"
      ? Volume2
      : type === "FORUM"
        ? MessagesSquare
        : type === "LINK"
          ? Link2
          : Hash;
  const missingAddress = type === "LINK" && !isAddress(url);

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
                className={choiceCard(type === option.value)}
              >
                <option.icon data-gc="servidor.create-channel-modal.optionicon" size={20} className="text-ink-faint" />
                <div data-gc="servidor.create-channel-modal.div--2" className="flex-1">
                  <p data-gc="servidor.create-channel-modal.p" className="text-sm font-medium">
                    {option.value === "LINK" ? t(option.label) : option.label}
                  </p>
                  <p data-gc="servidor.create-channel-modal.p--2" className="text-xs text-ink-faint">
                    {option.value === "LINK" ? t(option.hint) : option.hint}
                  </p>
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
          <NameChannelField data-gc="servidor.create-channel-modal.name-channel-field.set-name"
            id="channel-name"
            autoFocus
            value={name}
            onChange={setName}
            font={font}
            onFont={setFont}
            isVoice={type !== "TEXT"}
            icon={<Icon data-gc="servidor.create-channel-modal.icon" size={18} className="shrink-0 text-ink-faint" />}
            placeholder={type === "TEXT" ? "novo-canal" : "Sala 2"}
            onEnter={() => void submit()}
          />

          {type === "LINK" && (
            <div data-gc="servidor.create-channel-modal.div--3" className="mt-5">
              <Label data-gc="servidor.create-channel-modal.label--3" htmlFor="channel-url">
                {t("servidor.canal.endereco")}
              </Label>
              <Input data-gc="servidor.create-channel-modal.input"
                id="channel-url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://"
                onKeyDown={(event) => event.key === "Enter" && void submit()}
              />
              <p data-gc="servidor.create-channel-modal.p--3" className="mt-1.5 text-xs text-ink-faint">
                {t("servidor.canal.enderecoDica")}
              </p>
            </div>
          )}

          <div data-gc="servidor.create-channel-modal.div--4" className="mt-5 flex items-start gap-4">
            <div data-gc="servidor.create-channel-modal.div--5" className="min-w-0 flex-1">
              <p data-gc="servidor.create-channel-modal.p--4" className="flex items-center gap-1.5 text-sm font-medium">
                <Lock data-gc="servidor.create-channel-modal.lock" size={13} /> Canal privado
              </p>
              <p data-gc="servidor.create-channel-modal.p--5" className="mt-0.5 text-xs text-ink-faint">
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
          <Button data-gc="servidor.create-channel-modal.button--2" onClick={() => void submit()} disabled={createChannel.isPending || !name.trim() || missingAddress}>
            {createChannel.isPending ? "Criando…" : "Criar canal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
