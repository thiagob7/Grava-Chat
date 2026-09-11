import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { Message } from "@gravae/shared";

import { useReportMessage } from "~/@core/application/queries/message/use-denunciar-mensagem";
import { REPORT_REASONS, type ReportReason } from "~/@core/application/requests/guild/denunciar-guild";
import { Button } from "~/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label, Textarea } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";

const SNIPPET = 300;

export const ReportMessage: React.FC<{
  message: Message;
  isOpen: boolean;
  onClose: () => void;
}> = ({ message, isOpen, onClose }) => {
  const { t } = useTranslation();
  const report = useReportMessage();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  const snippet = message.content.slice(0, SNIPPET);

  return (
    <Dialog data-gc="conversa.denunciar-mensagem.dialog" open={isOpen} onOpenChange={(a) => !a && onClose()}>
      <DialogContent data-gc="conversa.denunciar-mensagem.dialog-content" className="max-w-md">
        <DialogHeader data-gc="conversa.denunciar-mensagem.dialog-header">
          <DialogTitle data-gc="conversa.denunciar-mensagem.dialog-title">{t("conversa.denuncia.titulo")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="conversa.denunciar-mensagem.dialog-body" className="space-y-4">
          <p data-gc="conversa.denunciar-mensagem.p" className="text-sm text-ink-muted">{t("conversa.denuncia.descricao")}</p>

          <div data-gc="conversa.denunciar-mensagem.div" className="rounded-md border border-line bg-surface-1 p-3">
            <p data-gc="conversa.denunciar-mensagem.p--2" className="text-xs font-semibold text-ink-muted">
              {t("conversa.denuncia.de", { nome: message.author.username })}
            </p>
            <p data-gc="conversa.denunciar-mensagem.p--3" className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">
              {snippet || t("conversa.denuncia.semTexto")}
            </p>
          </div>

          <div data-gc="conversa.denunciar-mensagem.div--2">
            <Label data-gc="conversa.denunciar-mensagem.label" htmlFor="motivo-da-denuncia-da-mensagem">{t("conversa.denuncia.motivo")}</Label>
            <SelectField data-gc="conversa.denunciar-mensagem.select-field"
              id="motivo-da-denuncia-da-mensagem"
              value={reason}
              onSelect={(value) => setReason(value as ReportReason)}
              options={REPORT_REASONS.map((m) => ({ value: m, label: t(`conversa.denuncia.motivos.${m}`) }))}
            />
          </div>

          <div data-gc="conversa.denunciar-mensagem.div--3">
            <Label data-gc="conversa.denunciar-mensagem.label--2" htmlFor="detalhes-da-denuncia-da-mensagem">{t("conversa.denuncia.detalhes")}</Label>
            <Textarea data-gc="conversa.denunciar-mensagem.textarea"
              id="detalhes-da-denuncia-da-mensagem"
              value={details}
              maxLength={1000}
              rows={4}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </DialogBody>

        <DialogFooter data-gc="conversa.denunciar-mensagem.dialog-footer">
          <Button data-gc="conversa.denunciar-mensagem.button.on-close" variant="surface" onClick={onClose}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="conversa.denunciar-mensagem.button"
            disabled={report.isPending}
            onClick={() =>
              report.mutate(
                { messageId: message.id, reason, details: details.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.success(t("conversa.denuncia.enviada"));
                    setDetails("");
                    onClose();
                  },
                },
              )
            }
          >
            {t("conversa.denuncia.enviar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
