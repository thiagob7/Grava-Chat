import React from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface UnsavedBarProps {
  visivel: boolean;
  salvando?: boolean;
  onDescartar: () => void;
  onSalvar: () => void;
  texto?: string;
  flutuante?: boolean;
  acaoDescartar?: string;
}

export const UnsavedBar: React.FC<UnsavedBarProps> = ({
  visivel,
  salvando = false,
  onDescartar,
  onSalvar,
  texto,
  flutuante = false,
  acaoDescartar,
}) => {
  const { t } = useTranslation();

  if (!visivel) return null;

  return (
    <footer data-gc="ui.unsaved-bar.footer"
      className={cn(
        "flex items-center gap-3 rounded-lg bg-surface-0 px-4 py-3",
        flutuante
          ?
            "pointer-events-auto fixed bottom-6 left-1/2 z-[60] w-[min(560px,92vw)] -translate-x-1/2 shadow-2xl ring-1 ring-line"
          : "sticky bottom-0 mt-6",
      )}
    >
      <p data-gc="ui.unsaved-bar.p" className="flex-1 text-sm">{texto ?? t("comum.naoSalvo")}</p>
      <Button data-gc="ui.unsaved-bar.button.on-descartar" variant="ghost" size="sm" onClick={onDescartar}>
        {acaoDescartar ?? t("comum.descartar")}
      </Button>
      <Button data-gc="ui.unsaved-bar.button.on-salvar"
        variant="success"
        size="sm"
        disabled={salvando}
        onClick={onSalvar}
      >
        {t(salvando ? "comum.salvando" : "comum.salvar")}
      </Button>
    </footer>
  );
};
