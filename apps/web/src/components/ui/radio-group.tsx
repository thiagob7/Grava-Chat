import * as React from "react";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

/*
  A bolinha do rádio, em SVG — e o SVG é o ponto.

  A nossa era um `<span>` com borda e outro `<span>` dentro. Casava com o olho e
  não com o tema: as regras da referência para o rádio usam `fill` e `stroke`, que
  em `<div>` não fazem nada. Carimbar o nome no `<span>` faria a regra "pousar"
  no placar e não pintar na tela — que é exatamente a mentira que estas
  ferramentas existem para não contar.

  A árvore é a deles: o indicador por fora (é onde um tema da comunidade põe fundo, borda
  e raio), e dentro o círculo de base mais o ponto do meio.

  O `data-state` também é deles: as regras miram `[data-state=checked]` no
  botão, não uma classe nossa de ativo.
*/
export const IndicadorDeRadio: React.FC<{ escolhido: boolean; className?: string }> = ({
  escolhido,
  className,
}) => (
  <span data-gc="ui.radio-group.span"
    aria-hidden
    className={cn(flxCls("indicadorDeRadio"), "block size-4 shrink-0", className)}
  >
    <svg data-gc="ui.radio-group.svg" viewBox="0 0 16 16" className="size-full">
      <circle data-gc="ui.radio-group.circle"
        className={flxCls("baseDoRadio")}
        cx="8"
        cy="8"
        r="7"
        fill="none"
        strokeWidth="1.5"
        stroke={escolhido ? "var(--color-brand)" : "var(--color-surface-4)"}
      />
      <circle data-gc="ui.radio-group.circle--2"
        className={flxCls("pontoDoRadio")}
        cx="8"
        cy="8"
        r="4"
        fill={escolhido ? "var(--color-brand)" : "transparent"}
      />
    </svg>
  </span>
);

/// As classes do botão de opção. Vem como string para caber num `cn()` que já existe.
export const classeDaOpcaoDeRadio = () => flxCls("opcaoDeRadio");

/// O invólucro do grupo — `role="radiogroup"` continua sendo de quem usa.
export const classeDoGrupoDeRadio = () => flxCls("grupoDeRadio");
