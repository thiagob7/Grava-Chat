import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import type { CreatePollInput } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Switch } from "~/components/ui/switch";
import { useTranslation } from "~/traducao";

interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (poll: CreatePollInput) => void;
}

const DURATIONS = [
  { hours: 1, key: "conversa.enquete.umaHora" },
  { hours: 4, key: "conversa.enquete.quatroHoras" },
  { hours: 8, key: "conversa.enquete.oitoHoras" },
  { hours: 24, key: "conversa.enquete.umDia" },
  { hours: 72, key: "conversa.enquete.tresDias" },
  { hours: 168, key: "conversa.enquete.umaSemana" },
];

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ open, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [duration, setDuration] = useState<number | null>(24);

  const valid = options.map((o) => o.trim()).filter(Boolean);
  const can = question.trim().length > 0 && valid.length >= 2;

  const close = () => {
    setQuestion("");
    setOptions(["", ""]);
    setMultiSelect(false);
    setDuration(24);
    onClose();
  };

  return (
    <Dialog data-gc="conversa.create-poll-modal.dialog" open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent data-gc="conversa.create-poll-modal.dialog-content">
        <DialogHeader data-gc="conversa.create-poll-modal.dialog-header">
          <DialogTitle data-gc="conversa.create-poll-modal.dialog-title">{t("conversa.enquete.criar")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="conversa.create-poll-modal.dialog-body" className="space-y-4">
          <div data-gc="conversa.create-poll-modal.div">
            <Label data-gc="conversa.create-poll-modal.label" htmlFor="pergunta">{t("conversa.enquete.pergunta")}</Label>
            <Input data-gc="conversa.create-poll-modal.input"
              id="pergunta"
              autoFocus
              value={question}
              maxLength={200}
              placeholder={t("conversa.enquete.exemplo")}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div data-gc="conversa.create-poll-modal.div--2">
            <Label data-gc="conversa.create-poll-modal.label--2">{t("conversa.enquete.respostas")}</Label>
            <div data-gc="conversa.create-poll-modal.div--3" className="space-y-2">
              {options.map((option, index) => (
                <div data-gc="conversa.create-poll-modal.div--4" key={index} className="flex items-center gap-2">
                  <Input data-gc="conversa.create-poll-modal.input--2"
                    value={option}
                    maxLength={80}
                    placeholder={`Opção ${index + 1}`}
                    onChange={(e) =>
                      setOptions((current) => current.map((o, i) => (i === index ? e.target.value : o)))
                    }
                  />
                  {options.length > 2 && (
                    <button data-gc="conversa.create-poll-modal.button"
                      onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                      aria-label={t("conversa.enquete.removerOpcao")}
                      className="rounded p-2 text-ink-muted transition hover:bg-surface-0 hover:text-danger"
                    >
                      <X data-gc="conversa.create-poll-modal.x" size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < LIMITS.optionsByPoll && (
              <Button data-gc="conversa.create-poll-modal.button--2"
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setOptions((current) => [...current, ""])}
              >
                <Plus data-gc="conversa.create-poll-modal.plus" size={14} /> {t("conversa.enquete.adicionarOpcao")}
              </Button>
            )}
          </div>

          <div data-gc="conversa.create-poll-modal.div--5" className="flex items-start gap-4">
            <div data-gc="conversa.create-poll-modal.div--6" className="flex-1">
              <p data-gc="conversa.create-poll-modal.p" className="text-sm font-medium">{t("conversa.enquete.varias")}</p>
              <p data-gc="conversa.create-poll-modal.p--2" className="mt-0.5 text-xs text-ink-faint">
                {t("conversa.enquete.variasDetalhe")}
              </p>
            </div>
            <Switch data-gc="conversa.create-poll-modal.switch.set-multi-select" checked={multiSelect} onCheckedChange={setMultiSelect} />
          </div>

          <div data-gc="conversa.create-poll-modal.div--7">
            <Label data-gc="conversa.create-poll-modal.label--3" htmlFor="duracao">{t("conversa.enquete.duracao")}</Label>
            <SelectField data-gc="conversa.create-poll-modal.select-field"
              id="duracao"
              value={duration === null ? "" : String(duration)}
              onSelect={(v) => setDuration(v ? Number(v) : null)}
              options={[
                ...DURATIONS.map((item) => ({ value: String(item.hours), label: t(item.key) })),
                { value: "", label: t("conversa.enquete.ateEncerrar") },
              ]}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="conversa.create-poll-modal.dialog-footer">
          <Button data-gc="conversa.create-poll-modal.button.close" variant="ghost" onClick={close}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="conversa.create-poll-modal.button--3"
            disabled={!can}
            onClick={() =>
              onCreate({
                question: question.trim(),
                options: valid.map((text) => ({ text })),
                multiSelect,
                durationHours: duration,
              })
            }
          >
            {t("conversa.enquete.criar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
