import React, { useEffect, useRef, useState } from "react";
import { fieldLimits, INTERACTION_RESPONSE_MS } from "@gravae/shared";

import { submitBotModal } from "~/@core/lib/websocket/emit-message-actions";
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
import { Input, Label, Textarea } from "~/components/ui/input";
import { useBotModalStore } from "~/features/conversa/stores/bot-modal-store";
import { useInteractionStore } from "~/features/conversa/stores/interaction-store";
import { useTranslation } from "~/traducao";

const WAIT_MS = INTERACTION_RESPONSE_MS + 1500;

export const BotModal: React.FC = () => {
  const { t } = useTranslation();
  const current = useBotModalStore((s) => s.current);
  const close = useBotModalStore((s) => s.close);
  const finished = useInteractionStore((s) => s.finished);
  const consume = useInteractionStore((s) => s.consume);

  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const waiting = useRef<{ interactionId: string | null; timer: number } | null>(null);

  useEffect(() => {
    if (!current) return;
    setValues(Object.fromEntries(current.modal.fields.map((field) => [field.customId, field.value ?? ""])));
    setSending(false);
    setError(null);
  }, [current]);

  const stopWaiting = () => {
    if (waiting.current) window.clearTimeout(waiting.current.timer);
    waiting.current = null;
  };

  useEffect(() => {
    const id = waiting.current?.interactionId;
    if (id && finished[id] && consume(id)) {
      stopWaiting();
      close();
    }
  }, [finished, consume, close]);

  useEffect(() => stopWaiting, []);

  if (!current) return null;

  const complete = current.modal.fields.every((field) => {
    const value = values[field.customId] ?? "";
    const { min, max, required } = fieldLimits(field);
    if (!value.trim()) return !required;
    return value.length >= min && value.length <= max;
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete || sending) return;

    setSending(true);
    setError(null);

    const timer = window.setTimeout(() => {
      stopWaiting();
      setSending(false);
      setError(t("conversa.botComponents.noResponse"));
    }, WAIT_MS);
    waiting.current = { interactionId: null, timer };

    try {
      const { interactionId } = await submitBotModal({ modalId: current.modalId, fields: values });
      if (waiting.current?.timer !== timer) return;

      waiting.current.interactionId = interactionId;
      if (consume(interactionId)) {
        stopWaiting();
        close();
      }
    } catch (err) {
      if (waiting.current?.timer !== timer) return;
      stopWaiting();
      setSending(false);
      setError(err instanceof Error ? err.message : t("conversa.botComponents.noResponse"));
    }
  };

  return (
    <Dialog data-gc="conversa.bot-modal.dialog" open onOpenChange={(open) => !open && !sending && close()}>
      <DialogContent data-gc="conversa.bot-modal.dialog-content" className="max-w-lg">
        <form data-gc="conversa.bot-modal.form.submit" onSubmit={submit} className="flex min-h-0 flex-col">
          <DialogHeader data-gc="conversa.bot-modal.dialog-header">
            <DialogTitle data-gc="conversa.bot-modal.dialog-title">{current.modal.title}</DialogTitle>
            <DialogDescription data-gc="conversa.bot-modal.dialog-description">{t("conversa.botComponents.formFrom", { nome: current.bot.displayName })}</DialogDescription>
          </DialogHeader>

          <DialogBody data-gc="conversa.bot-modal.dialog-body" className="space-y-4">
            {current.modal.fields.map((field) => {
              const { max, required } = fieldLimits(field);
              const id = `bot-modal-${field.customId}`;
              const value = values[field.customId] ?? "";
              const change = (text: string) => setValues((old) => ({ ...old, [field.customId]: text }));

              return (
                <div data-gc="conversa.bot-modal.div" key={field.customId}>
                  <Label data-gc="conversa.bot-modal.label" htmlFor={id}>
                    {field.label}
                    {!required && <span data-gc="conversa.bot-modal.span" className="ml-1 font-normal text-ink-faint">({t("conversa.botComponents.optional")})</span>}
                  </Label>

                  {field.style === "paragraph" ? (
                    <Textarea data-gc="conversa.bot-modal.textarea"
                      id={id}
                      value={value}
                      rows={4}
                      maxLength={max}
                      placeholder={field.placeholder}
                      required={required}
                      disabled={sending}
                      onChange={(e) => change(e.target.value)}
                    />
                  ) : (
                    <Input data-gc="conversa.bot-modal.input"
                      id={id}
                      value={value}
                      maxLength={max}
                      placeholder={field.placeholder}
                      required={required}
                      disabled={sending}
                      onChange={(e) => change(e.target.value)}
                    />
                  )}

                  {value.length > max * 0.8 && (
                    <p data-gc="conversa.bot-modal.p" className="mt-1 text-right text-xs tabular-nums text-ink-faint">
                      {value.length}/{max}
                    </p>
                  )}
                </div>
              );
            })}

            {error && (
              <p data-gc="conversa.bot-modal.p--2" role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
          </DialogBody>

          <DialogFooter data-gc="conversa.bot-modal.dialog-footer">
            <Button data-gc="conversa.bot-modal.button.close" type="button" variant="surface" disabled={sending} onClick={close}>
              {t("comum.cancelar")}
            </Button>
            <Button data-gc="conversa.bot-modal.button" type="submit" loading={sending} disabled={!complete}>
              {t("comum.enviar")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
