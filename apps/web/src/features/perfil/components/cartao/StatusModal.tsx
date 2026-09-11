import React, { useState } from "react";
import { Smile, X } from "lucide-react";
import { LIMITS, type CustomStatus } from "@gravae/shared";

import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
import { Button } from "~/components/ui/button";
import { SelectField } from "~/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Label, bareField, fieldGroup } from "~/components/ui/input";
import { cn } from "~/lib/utils";
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

          <div data-gc="perfil.cartao.status-modal.div--3" className={cn(fieldGroup, "gap-1 px-1.5")}>
            <EmojiPicker data-gc="perfil.cartao.status-modal.emoji-picker.set-emoji" onPick={setEmoji}>
              <button data-gc="perfil.cartao.status-modal.button"
                type="button"
                aria-label={t("perfil.status.escolherEmoji")}
                className="flex size-8 shrink-0 items-center justify-center rounded text-lg text-ink-faint transition hover:bg-surface-3 hover:text-ink"
              >
                {emoji || <Smile data-gc="perfil.cartao.status-modal.smile" size={16} />}
              </button>
            </EmojiPicker>

            <input data-gc="perfil.cartao.status-modal.input"
              id="status-texto"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={LIMITS.customStatus}
              placeholder={t("perfil.status.oQuePensa")}
              className={bareField}
            />

            {emoji && (
              <button data-gc="perfil.cartao.status-modal.button--2"
                type="button"
                onClick={() => setEmoji("")}
                aria-label={t("perfil.status.tirarEmoji")}
                className="shrink-0 rounded p-1.5 text-ink-faint transition hover:text-ink"
              >
                <X data-gc="perfil.cartao.status-modal.x" size={14} />
              </button>
            )}
          </div>
        </div>

        <div data-gc="perfil.cartao.status-modal.div--4" className="mt-4 flex items-center gap-3">
          <SelectField data-gc="perfil.cartao.status-modal.select-field.set-deadline"
            value={deadline}
            onSelect={setDeadline}
            className="flex-1"
            options={DEADLINES.map((p) => ({ value: p.id, label: labelWithHour(p) }))}
          />

          <Button data-gc="perfil.cartao.status-modal.button.save" onClick={save} disabled={saving}>
            {t(saving ? "comum.salvando" : "comum.salvar")}
          </Button>
        </div>

        {current && (
          <button data-gc="perfil.cartao.status-modal.button--3"
            onClick={() => onSave(null)}
            className="mt-3 text-xs text-ink-faint transition hover:text-danger"
          >
            {t("perfil.status.limparAgora")}
          </button>
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
