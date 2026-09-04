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
  canal: string | null;
  onFechar: () => void;
  onTrazerParaCa: () => void;
}

export const ConfirmacaoDeVoz: React.FC<Props> = ({ canal, onFechar, onTrazerParaCa }) => {
  const { t } = useTranslation();

  return (
  <Dialog open={Boolean(canal)} onOpenChange={(v) => !v && onFechar()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{t("chamada.jaConectado.titulo")}</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <p className="text-sm leading-relaxed text-ink-muted">
          Sua conta está conectada em {canal ? <b className="text-ink">{canal}</b> : "outro canal"}{" "}
          por outro aparelho ou outra aba — e o áudio está tocando lá.
        </p>

        <div className="mt-5 space-y-2">
          <Button className="w-full" onClick={onTrazerParaCa}>
            {t("chamada.jaConectado.trazer")}
          </Button>

          <Button variant="surface" className="w-full" onClick={onFechar}>
            {t("chamada.jaConectado.deixar")}
          </Button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          Trazendo para cá, a outra ponta sai da chamada — sua conta fica em um
          lugar de cada vez.
        </p>
      </DialogBody>
    </DialogContent>
  </Dialog>
  );
};
