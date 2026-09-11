import React from "react";

import { Button } from "~/components/ui/button";
import { useTranslation } from "~/traducao";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface Props {
  channel: string | null;
  onClose: () => void;
  onBringForCa: () => void;
}

export const VoiceConfirmation: React.FC<Props> = ({ channel, onClose, onBringForCa }) => {
  const { t } = useTranslation();

  return (
  <Dialog data-gc="voz.confirmacao-de-voz.dialog" open={Boolean(channel)} onOpenChange={(v) => !v && onClose()}>
    <DialogContent data-gc="voz.confirmacao-de-voz.dialog-content" className="max-w-md">
      <DialogHeader data-gc="voz.confirmacao-de-voz.dialog-header">
        <DialogTitle data-gc="voz.confirmacao-de-voz.dialog-title">{t("chamada.jaConectado.titulo")}</DialogTitle>
      </DialogHeader>

      <DialogBody data-gc="voz.confirmacao-de-voz.dialog-body">
        <p data-gc="voz.confirmacao-de-voz.p" className="text-sm leading-relaxed text-ink-muted">
          Sua conta está conectada em {channel ? <b data-gc="voz.confirmacao-de-voz.b" className="text-ink">{channel}</b> : "outro canal"}{" "}
          por outro aparelho ou outra aba — e o áudio está tocando lá.
        </p>

        <div data-gc="voz.confirmacao-de-voz.div" className="mt-5 space-y-2">
          <Button data-gc="voz.confirmacao-de-voz.button.on-bring-for-ca" className="w-full" onClick={onBringForCa}>
            {t("chamada.jaConectado.trazer")}
          </Button>

          <Button data-gc="voz.confirmacao-de-voz.button.on-close" variant="surface" className="w-full" onClick={onClose}>
            {t("chamada.jaConectado.deixar")}
          </Button>
        </div>

        <p data-gc="voz.confirmacao-de-voz.p--2" className="mt-3 text-xs leading-relaxed text-ink-faint">
          Trazendo para cá, a outra ponta sai da chamada — sua conta fica em um
          lugar de cada vez.
        </p>
      </DialogBody>
    </DialogContent>
  </Dialog>
  );
};
