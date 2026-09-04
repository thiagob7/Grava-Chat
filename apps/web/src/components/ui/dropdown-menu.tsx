import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";

import { Check, ChevronRight } from "lucide-react";

import { cn } from "~/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        /*
          `regiao-sem-arrasto` não é enfeite: sem ela o menu fica inclicável em
          boa parte do app.

          Menu flutuante vive num portal, fora da árvore de quem o abriu — mas o
          sistema recorta a região de arrasto pelo RETÂNGULO PINTADO, não pelo
          DOM. Cabeçalho de servidor, de conversa e de DM são todos
          `regiao-de-arrasto`, e o do servidor com faixa chega a 30vh: o menu
          aberto ali cai inteiro dentro do retângulo e o sistema leva o clique
          pra arrastar a janela antes de a página enxergar qualquer coisa. O
          menu abre, destaca no hover e simplesmente não obedece.
        */
        "regiao-sem-arrasto z-50 min-w-56 rounded-lg bg-surface-4 p-1.5 shadow-2xl outline-none",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
);

interface ItemProps extends React.ComponentProps<typeof DropdownPrimitive.Item> {
  danger?: boolean;
}

export const DropdownMenuItem = ({ className, danger, ...props }: ItemProps) => (
  <DropdownPrimitive.Item
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm outline-none transition",
      danger
        ? "text-danger data-[highlighted]:bg-danger data-[highlighted]:text-white"
        : "text-ink-muted data-[highlighted]:bg-brand data-[highlighted]:text-white",
      className,
    )}
    {...props}
  />
);

/**
 * Título de um bloco dentro do menu ("Dispositivo de entrada").
 *
 * Sem ele, uma lista de microfones colada numa lista de volumes vira uma coisa
 * só e ninguém sabe onde uma acaba.
 */
export const DropdownMenuLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Label>) => (
  <DropdownPrimitive.Label
    className={cn("px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint", className)}
    {...props}
  />
);

export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

/// Escolha entre várias: o ponto à direita, como no resto do app.
export const DropdownMenuRadioItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.RadioItem>) => (
  <DropdownPrimitive.RadioItem
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm text-ink-muted outline-none transition",
      "data-[highlighted]:bg-brand data-[highlighted]:text-white data-[state=checked]:text-ink",
      className,
    )}
    {...props}
  >
    <span className="min-w-0 flex-1 truncate">{children}</span>

    <span className="flex size-4 shrink-0 items-center justify-center rounded-full border border-ink-faint">
      <DropdownPrimitive.ItemIndicator>
        <span className="block size-2 rounded-full bg-brand" />
      </DropdownPrimitive.ItemIndicator>
    </span>
  </DropdownPrimitive.RadioItem>
);

/// Liga/desliga dentro do menu, com o tique à direita.
export const DropdownMenuCheckboxItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.CheckboxItem>) => (
  <DropdownPrimitive.CheckboxItem
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm text-ink-muted outline-none transition",
      "data-[highlighted]:bg-brand data-[highlighted]:text-white data-[state=checked]:text-ink",
      className,
    )}
    {...props}
  >
    <span className="min-w-0 flex-1 truncate">{children}</span>

    <span className="flex size-4 shrink-0 items-center justify-center rounded border border-ink-faint">
      <DropdownPrimitive.ItemIndicator>
        <Check size={12} />
      </DropdownPrimitive.ItemIndicator>
    </span>
  </DropdownPrimitive.CheckboxItem>
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) => (
  <DropdownPrimitive.Separator className={cn("my-1.5 h-px bg-line", className)} {...props} />
);

export const DropdownMenuSub = DropdownPrimitive.Sub;

export const DropdownMenuSubTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.SubTrigger>) => (
  <DropdownPrimitive.SubTrigger
    className={cn(
      "flex cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-sm text-ink-muted outline-none transition",
      "data-[highlighted]:bg-brand data-[highlighted]:text-white data-[state=open]:bg-surface-3",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight size={14} />
  </DropdownPrimitive.SubTrigger>
);

export const DropdownMenuSubContent = ({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.SubContent>) => (
  <DropdownPrimitive.Portal>
    <DropdownPrimitive.SubContent
      className={cn(
        /// Mesmo motivo do menu principal, logo acima.
        "regiao-sem-arrasto z-50 max-h-[70vh] min-w-48 overflow-y-auto rounded-lg bg-surface-4 p-1.5 shadow-2xl outline-none",
        className,
      )}
      {...props}
    />
  </DropdownPrimitive.Portal>
);
