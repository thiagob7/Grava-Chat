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
          "z-50 rounded bg-surface-4 px-2.5 py-1.5 text-xs font-medium text-ink shadow-lg",
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
                  className="rounded border border-white/10 bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-muted"
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
          A setinha vem do próprio Radix (`Tooltip.Arrow`), como a do balão —
          nada desenhado à mão. Ela liga a dica ao botão: sem isso, com dois
          botões vizinhos, não dá pra saber de quem é a dica.
        */}
        <TooltipPrimitive.Arrow width={12} height={6} className="fill-surface-4" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
);
