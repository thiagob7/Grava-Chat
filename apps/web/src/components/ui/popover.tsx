import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

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
 * `fill-surface-4` é a cor do próprio balão. Balão, menu e dica moram no
 * degrau mais alto — a superfície de formulário —, que é o único
 * que se destaca da conversa em qualquer um dos temas. Na primeira tentativa
 * o balão era `surface-0`, a mesma tinta do fundo, e a seta não aparecia.
 */
export const PopoverArrow = ({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) => (
  <PopoverPrimitive.Arrow
    width={14}
    height={7}
    className={cn("fill-surface-4", className)}
    {...props}
  />
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
        "z-50 w-72 rounded-lg bg-surface-4 p-4 shadow-2xl outline-none",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );

  return portal ? <PopoverPrimitive.Portal>{conteudo}</PopoverPrimitive.Portal> : conteudo;
};
