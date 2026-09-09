import React from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface UnsavedBarProps {
  visible: boolean;
  saving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
  text?: string;
  floating?: boolean;
  discardLabel?: string;
}

export const UnsavedBar: React.FC<UnsavedBarProps> = ({
  visible,
  saving = false,
  onDiscard,
  onSave,
  text,
  floating = false,
  discardLabel,
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <footer data-gc="ui.unsaved-bar.footer"
      className={cn(
        "flex items-center gap-3 rounded-lg bg-surface-0 px-4 py-3",
        floating
          ?
            "pointer-events-auto fixed bottom-6 left-1/2 z-[60] w-[min(560px,92vw)] -translate-x-1/2 shadow-2xl ring-1 ring-line"
          : "sticky bottom-0 mt-6",
      )}
    >
      <p data-gc="ui.unsaved-bar.p" className="flex-1 text-sm">{text ?? t("comum.naoSalvo")}</p>
      <Button data-gc="ui.unsaved-bar.button.on-discard" variant="ghost" size="sm" onClick={onDiscard}>
        {discardLabel ?? t("comum.descartar")}
      </Button>
      <Button data-gc="ui.unsaved-bar.button.on-save"
        variant="success"
        size="sm"
        disabled={saving}
        onClick={onSave}
      >
        {t(saving ? "comum.salvando" : "comum.salvar")}
      </Button>
    </footer>
  );
};
