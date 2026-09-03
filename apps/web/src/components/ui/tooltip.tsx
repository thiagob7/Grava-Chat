import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "~/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;

/*
  As teclas do atalho aparecem DENTRO da dica, em teclinhas.

  Escrever "Criar servidor (Cmd+Shift+N)" no meio da frase mistura duas coisas
  que se leem de jeitos diferentes: o que o botão faz e como chamá-lo pelo
  teclado. Separado e desenhado como tecla, o atalho é aprendido de passagem —
  que é o único jeito de alguém aprender atalho.
*/
export const Tooltip = ({
  children,
  label,
  atalho,
  side = "top",
}: {
  children: React.ReactNode;
  label: string;
  /// teclas já prontas para leitura, ex.: ["⌘", "Shift", "N"]
  atalho?: string[];
  side?: "top" | "right" | "bottom" | "left";
}) => (
  <TooltipPrimitive.Root delayDuration={300}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className={cn(
          /*
            Medidas da referência: a cor já era a de menu (`surface-4`), mas
            faltavam a borda de 1px e a sombra baixa e larga — sem elas o balão
            se dissolve quando cai sobre um painel de cor parecida, que é
            justamente onde ele mais aparece.
          */
          "z-50 rounded-md border border-line bg-surface-4 px-2.5 py-[7px] text-xs font-medium text-ink",
          "shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)]",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0",
        )}
      >
        {atalho ? (
          <span className="flex items-center gap-2">
            {label}
            <span className="flex items-center gap-1">
              {atalho.map((tecla) => (
                <kbd
                  key={tecla}
                  className="rounded border border-white/10 bg-surface-3 px-1.5 py-0.5 text-10 font-semibold uppercase text-ink-muted"
                >
                  {tecla}
                </kbd>
              ))}
            </span>
          </span>
        ) : (
          label
        )}

        {/*
          A setinha vem do próprio Radix (`Tooltip.Arrow`), que a posiciona e a
          gira sozinho conforme o lado que a dica acabou escolhendo. O DESENHO
          é nosso, e é por causa da borda: a seta de fábrica é um polígono só,
          pintado e sem traço, então o contorno de 1px terminava na curva do
          cartão e a ponta saía dali como um pingo solto de tinta. Balão com
          borda tem UM contorno, que desce por uma rampa, vira na ponta e sobe
          pela outra.

          São duas figuras, e cada uma resolve metade:

          1. O polígono cheio ganhou um COLARINHO — os dois pontos em `y=-2`,
             acima do `viewBox`. Ele sobe 1,2px por cima da borda de baixo do
             cartão e a tapa na largura da seta, que é o que apaga a linha
             atravessada no alto do triângulo. Sem ela apagada, o contorno
             fecharia a base e a seta viraria um losango partido ao meio. Isso
             funciona porque a seta é filha do conteúdo, e filho pinta por cima
             da borda do pai.
          2. O traço, só nas duas rampas (`M0,0 15,10 30,0`), sem a base.

          Duas medidas que parecem detalhe e não são. `non-scaling-stroke`,
          porque o `viewBox` de 30×10 é espremido em 12×6 com
          `preserveAspectRatio="none"`: sem ele o mesmo 1px sairia mais gordo
          na horizontal do que na vertical. E a rampa começa em `y=0`, não
          acima: tentei fazê-la subir até o meio da borda para "emendar
          melhor", e o resultado foi ela furar a linha e desenhar um X na
          junção. Quem emenda é o colarinho, não a rampa.

          `overflow-visible` porque o colarinho e a espessura do traço passam
          do `viewBox`, e o padrão do SVG é cortar.
        */}
        <TooltipPrimitive.Arrow asChild width={12} height={6}>
          <svg className="overflow-visible">
            <polygon points="0,-2 30,-2 30,0 15,10 0,0" className="fill-surface-4" />
            <path
              d="M0,0 15,10 30,0"
              fill="none"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="stroke-line"
            />
          </svg>
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
