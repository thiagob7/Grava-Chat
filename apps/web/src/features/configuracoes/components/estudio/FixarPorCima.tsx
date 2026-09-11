import React from "react";
import { Pin, PinOff } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

export const PinByUp: React.FC = () => {
  const [pinned, setPinned] = React.useState(false);
  const appWindow = window.gravae?.appWindow;
  const sabe = Boolean(appWindow?.pinByUp && appWindow.thisByUp);

  React.useEffect(() => {
    if (!sabe) return;

    void appWindow?.thisByUp?.().then(setPinned);
  }, [sabe, appWindow]);

  if (!sabe) return null;

  return (
    <Tooltip data-gc="configuracoes.estudio.fixar-por-cima.tooltip" label={pinned ? "Soltar a janela" : "Manter por cima das outras"} side="bottom">
      <button data-gc="configuracoes.estudio.fixar-por-cima.button"
        type="button"
        aria-label={pinned ? "Soltar a janela" : "Manter por cima das outras"}
        aria-pressed={pinned}
        onClick={() => void appWindow?.pinByUp?.(!pinned).then(setPinned)}
        className={cn(
          "regiao-sem-arrasto flex size-7 items-center justify-center rounded-md transition",
          pinned ? "bg-brand text-sobre-marca" : "text-ink-faint hover:bg-surface-3 hover:text-ink",
        )}
      >
        {pinned ? <Pin data-gc="configuracoes.estudio.fixar-por-cima.pin" size={15} /> : <PinOff data-gc="configuracoes.estudio.fixar-por-cima.pin-off" size={15} />}
      </button>
    </Tooltip>
  );
};
