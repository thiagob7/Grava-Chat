import React from "react";
import { Pin, PinOff } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

/*
  Deixar a janela do estúdio por cima das outras.

  Só existe no aplicativo de mesa, e só quando a casca instalada sabe fazer —
  ela é servida pela rede e pode ser mais velha que este front, então a ponte
  é perguntada antes de ser chamada. No navegador não há o que fixar: quem
  manda na janela é o próprio navegador.
*/
export const FixarPorCima: React.FC = () => {
  const [fixado, setFixado] = React.useState(false);
  const janela = window.gravae?.janela;
  const sabe = Boolean(janela?.fixarPorCima && janela.estaPorCima);

  React.useEffect(() => {
    if (!sabe) return;

    void janela?.estaPorCima?.().then(setFixado);
  }, [sabe, janela]);

  if (!sabe) return null;

  return (
    <Tooltip data-gc="configuracoes.estudio.fixar-por-cima.tooltip" label={fixado ? "Soltar a janela" : "Manter por cima das outras"} side="bottom">
      <button data-gc="configuracoes.estudio.fixar-por-cima.button"
        type="button"
        aria-label={fixado ? "Soltar a janela" : "Manter por cima das outras"}
        aria-pressed={fixado}
        onClick={() => void janela?.fixarPorCima?.(!fixado).then(setFixado)}
        className={cn(
          "regiao-sem-arrasto flex size-7 items-center justify-center rounded-md transition",
          fixado ? "bg-brand text-sobre-marca" : "text-ink-faint hover:bg-surface-3 hover:text-ink",
        )}
      >
        {fixado ? <Pin data-gc="configuracoes.estudio.fixar-por-cima.pin" size={15} /> : <PinOff data-gc="configuracoes.estudio.fixar-por-cima.pin-off" size={15} />}
      </button>
    </Tooltip>
  );
};
