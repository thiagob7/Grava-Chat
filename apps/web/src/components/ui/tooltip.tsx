import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { DesenhoDaSeta } from "~/components/ui/seta-do-balao";
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
          A setinha liga a dica ao botão: sem ela, com dois botões vizinhos,
          não dá pra saber de quem é a dica. Quem a posiciona e a gira é o
          Radix; quem a desenha é o `DesenhoDaSeta`, porque a seta de fábrica
          não tem traço e o contorno do cartão morreria antes da ponta.
        */}
        <TooltipPrimitive.Arrow asChild width={12} height={6}>
          <svg className="overflow-visible">
            <DesenhoDaSeta />
          </svg>
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
