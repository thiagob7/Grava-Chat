import React, { useState } from "react";
import { Smile, X } from "lucide-react";
import { LIMITS, type CustomStatus } from "@gravae/shared";

import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
import { Button, IconButton } from "~/components/ui/button";
import { SelectField } from "~/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { BareInput, FieldGroup, Label } from "~/components/ui/input";
import { EmojiPicker } from "~/features/expressao/components/SeletorDeEmoji";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import type { ProfileStyle } from "@gravae/shared";
import { i18next, currentLanguage, useTranslation } from "~/traducao";

const DEADLINES = [
  { id: "never", key: "naoLimpar", minutes: null },
  { id: "30m", key: "limpar30m", minutes: 30 },
  { id: "1h", key: "limpar1h", minutes: 60 },
  { id: "4h", key: "limpar4h", minutes: 240 },
  {
    id: "hoje",
    key: "limparHoje",
    minutes: null as number | null,
    dayUntilEnd: true,
  },
  { id: "amanha", key: "limparAmanha", minutes: 24 * 60 },
] as const;

function labelWithHour(deadline: (typeof DEADLINES)[number]): string {
  const name = i18next.t(`perfil.status.${deadline.key}`);
  const iso = computeExpiry(deadline);
  if (!iso) return name;

  const hour = new Date(iso).toLocaleTimeString(currentLanguage(), {
    hour: "2-digit",
    minute: "2-digit",
  });

  return i18next.t("perfil.status.comHora", { prazo: name, hora: hour });
}

interface StatusModalProps {
  open: boolean;
  user: SelfUserModel;
  profile: ProfileStyle | null;
  onClose: () => void;
  onSave: (status: CustomStatus | null) => void;
  saving?: boolean;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  open,
  user,
  profile,
  onClose,
  onSave,
  saving = false,
}) => {
  const { t } = useTranslation();
  const current = user.customStatus;
  const [text, setText] = useState(current?.text ?? "");
  const [emoji, setEmoji] = useState(current?.emoji ?? "");
  const [deadline, setDeadline] = useState<string>("never");

  const preview: CustomStatus | null = text.trim()
    ? { text: text.trim(), emoji: emoji.trim() || null, expiresAt: null }
    : null;

  const previewCard: CustomStatus = preview ?? {
    text: t("perfil.status.oQuePensa"),
    emoji: null,
    expiresAt: null,
  };

  const save = () => {
    if (!preview) return onSave(null);

    const picked = DEADLINES.find((p) => p.id === deadline);
    onSave({ ...preview, expiresAt: computeExpiry(picked) });
  };

  return (
    <Dialog data-gc="perfil.cartao.status-modal.dialog" open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent data-gc="perfil.cartao.status-modal.dialog-content" className="max-w-md p-5">
        <DialogTitle data-gc="perfil.cartao.status-modal.dialog-title" className="text-lg font-semibold">
          {t("perfil.status.definir")}
        </DialogTitle>

        <div data-gc="perfil.cartao.status-modal.div" className="mt-4">
          <ProfileCardVisual data-gc="perfil.cartao.status-modal.profile-card-visual"
            id={user.id}
            displayName={user.displayName}
            username={user.username}
            avatarUrl={user.avatarUrl}
            status={user.status}
            profile={profile}
            customStatus={previewCard}
          />
        </div>

        <div data-gc="perfil.cartao.status-modal.div--2" className="mt-5">
          <Label data-gc="perfil.cartao.status-modal.label" htmlFor="status-texto">{t("perfil.status.titulo")}</Label>

          <FieldGroup data-gc="perfil.cartao.status-modal.field-group" className="gap-1 px-1.5">
            <EmojiPicker data-gc="perfil.cartao.status-modal.emoji-picker.set-emoji" onPick={setEmoji}>
              <IconButton data-gc="perfil.cartao.status-modal.icon-button"
                label={t("perfil.status.escolherEmoji")}
                className="text-lg text-ink-faint"
              >
                {emoji || <Smile data-gc="perfil.cartao.status-modal.smile" />}
              </IconButton>
            </EmojiPicker>

            <BareInput data-gc="perfil.cartao.status-modal.bare-input"
              id="status-texto"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={LIMITS.customStatus}
              placeholder={t("perfil.status.oQuePensa")}
            />

            {emoji && (
              <IconButton data-gc="perfil.cartao.status-modal.icon-button--2"
                size="xs"
                label={t("perfil.status.tirarEmoji")}
                onClick={() => setEmoji("")}
                className="text-ink-faint"
              >
                <X data-gc="perfil.cartao.status-modal.x" />
              </IconButton>
            )}
          </FieldGroup>
        </div>

        <div data-gc="perfil.cartao.status-modal.div--3" className="mt-4 flex items-center gap-3">
          <SelectField data-gc="perfil.cartao.status-modal.select-field.set-deadline"
            value={deadline}
            onSelect={setDeadline}
            className="flex-1"
            options={DEADLINES.map((p) => ({ value: p.id, label: labelWithHour(p) }))}
          />

          <Button data-gc="perfil.cartao.status-modal.button.save" onClick={save} loading={saving}>
            {t("comum.salvar")}
          </Button>
        </div>

        {current && (
          <Button data-gc="perfil.cartao.status-modal.button"
            variant="link"
            size="xs"
            onClick={() => onSave(null)}
            className="mt-3 px-0 font-normal text-ink-faint hover:text-danger hover:no-underline"
          >
            {t("perfil.status.limparAgora")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

function computeExpiry(deadline?: (typeof DEADLINES)[number]): string | null {
  if (!deadline) return null;

  if ("dayUntilEnd" in deadline && deadline.dayUntilEnd) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }

  if (!deadline.minutes) return null;

  return new Date(Date.now() + deadline.minutes * 60_000).toISOString();
}
