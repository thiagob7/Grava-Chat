import React from "react";

import { Switch } from "~/components/ui/switch";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { useAparencia } from "~/stores/aparencia";

export const AcessibilidadeSection: React.FC = () => {
  const prefs = useAparencia();

  /*
    O que o SISTEMA já pede.

    Quem ligou "reduzir movimento" no macOS ou no Windows já vinha atendido
    pelo CSS, e dizer isso muda o que o interruptor significa: ele não está
    desligado, está redundante. Sem essa linha, a pessoa desliga aqui achando
    que voltou a ter animação, e nada muda.
  */
  const sistemaPede =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao
        id="movimento"
        titulo="Movimento"
        detalhe="Aberturas, deslizes e transições. Desligar não tira nada da tela: só faz o que ia se mover aparecer direto no lugar."
      >
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Reduzir animação</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {sistemaPede
                ? "O seu sistema já pede movimento reduzido, e o Gravaê já obedece. Este botão é para quem quer o mesmo sem mexer no sistema inteiro."
                : "Corta as animações do app inteiro, inclusive as dos avisos e as do painel de chamada."}
            </p>
          </div>

          <Switch
            checked={prefs.reduzirAnimacao}
            onCheckedChange={(reduzirAnimacao) => prefs.definir({ reduzirAnimacao })}
          />
        </div>
      </Secao>
    </div>
  );
};
