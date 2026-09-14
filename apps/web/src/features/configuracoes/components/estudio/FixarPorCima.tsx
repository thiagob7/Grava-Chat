import React from "react";
import { Pin, PinOff } from "lucide-react";

import { IconButton } from "~/components/ui/button";
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
      <IconButton data-gc="configuracoes.estudio.fixar-por-cima.icon-button"
        variant={pinned ? "primary" : "ghost"}
        label={pinned ? "Soltar a janela" : "Manter por cima das outras"}
        aria-pressed={pinned}
        onClick={() => void appWindow?.pinByUp?.(!pinned).then(setPinned)}
        className={cn(
          "regiao-sem-arrasto size-7 [&_svg]:size-[15px]",
          !pinned && "text-ink-faint hover:bg-surface-3",
        )}
      >
        {pinned ? <Pin data-gc="configuracoes.estudio.fixar-por-cima.pin" /> : <PinOff data-gc="configuracoes.estudio.fixar-por-cima.pin-off" />}
      </IconButton>
    </Tooltip>
  );
};
