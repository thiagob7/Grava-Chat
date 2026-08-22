import * as React from "react";

import { cn } from "~/lib/utils";

/**
 * O visual de TODO campo de formulário — input, textarea e select.
 *
 * Existe como string exportada porque metade dos campos do app não usa o
 * `<Input>`: `<textarea>` e `<select>` não cabem no mesmo componente, e as dez
 * cópias que existiam da classe já tinham divergido.
 *
 * Duas escolhas que valem explicação:
 *
 * - **Fundo `surface-3`, não `surface-0`.** Campo é onde se escreve; ele tem
 *   que parecer levantado do painel, não um buraco nele. O `surface-0` é a cor
 *   da coluna de servidores — quase preto, e num painel escuro sumia.
 * - **Anel de foco NEUTRO.** Era o vermelho da marca, que aqui é a cor de
 *   perigo: todo campo focado parecia estar em erro. Cinza claro cumpre o papel
 *   de dizer "é aqui que você está digitando" sem gritar.
 */
export const campoBase =
  "w-full rounded bg-surface-3 px-3 py-2.5 text-sm text-ink outline-none ring-ink-faint/70 transition placeholder:text-ink-faint focus:ring-2";

export const Input = ({ className, ...props }: React.ComponentProps<"input">) => (
  <input className={cn(campoBase, className)} {...props} />
);

export const Label = ({ className, ...props }: React.ComponentProps<"label">) => (
  <label
    className={cn("mb-1.5 block text-xs font-semibold uppercase text-ink-muted", className)}
    {...props}
  />
);
