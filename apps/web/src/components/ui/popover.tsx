import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { DesenhoDaSeta } from "~/components/ui/seta-do-balao";
import { cn } from "~/lib/utils";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;
/// Ancora o balão num elemento que NÃO é o gatilho — necessário quando quem
/// abre é o mouse passando por cima, e não um clique.
export const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * A setinha que liga o balão ao que o abriu.
 *
 * Vai DENTRO do `PopoverContent` — o Radix a posiciona sozinho no lado que o
 * balão acabou escolhendo, e some se não conseguir apontar pro alvo.
 *
 * A cor é a do próprio balão, e vem do `DesenhoDaSeta`. Balão, menu e dica
 * moram no degrau mais alto — a superfície de formulário —, que é o único que
 * se destaca da conversa em qualquer um dos temas. Na primeira tentativa o
 * balão era `surface-0`, a mesma tinta do fundo, e a seta não aparecia.
 */
export const PopoverArrow = ({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) => (
  <PopoverPrimitive.Arrow asChild width={14} height={7} {...props}>
    <svg className={cn("overflow-visible", className)}>
      <DesenhoDaSeta />
    </svg>
  </PopoverPrimitive.Arrow>
);

export const PopoverContent = ({
  className,
  align = "start",
  sideOffset = 8,
  portal = true,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & { portal?: boolean }) => {
  const conteudo = (
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        /*
          A borda de 1px é a mesma da dica, e pelo mesmo motivo: `surface-4`
          sozinha se dissolve quando o balão cai sobre um painel de cor
          parecida — que é justamente onde ele mais aparece, já que quase todo
          popover daqui nasce dentro de um painel. A sombra sugere a separação;
          quem a AFIRMA é a borda.

          Os dois pontos de uso que embrulham o seletor de expressões já pediam
          `border-0` antes desta linha existir: eles desenham a própria moldura,
          e continuam mandando.
        */
        "z-50 w-72 rounded-lg border border-line bg-surface-4 p-4 shadow-2xl outline-none",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );

  return portal ? <PopoverPrimitive.Portal>{conteudo}</PopoverPrimitive.Portal> : conteudo;
};
