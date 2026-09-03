import React from "react";
import { Check } from "lucide-react";

import { cn } from "~/lib/utils";

/**
 * Caixa de marcar, desenhada por nós.
 *
 * A nativa é um quadrado branco do sistema, e num tema escuro ela aparece como
 * um buraco de luz no meio do texto — foi assim que ela ficou no aviso de
 * aparelho novo. `accent-color` pinta o CHEIO quando marcada, e não faz nada
 * pela caixa vazia, que é justamente o estado em que ela mais destoa.
 *
 * O `input` continua existindo e continua sendo quem responde: ele só fica
 * invisível por cima da caixa desenhada. Trocar por uma `div` com `role`
 * custaria o foco por teclado, o clique no rótulo e o `:checked` de graça — e
 * daria trabalho para reconstruir cada um deles pior.
 */
export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  className,
  checked,
  ...props
}) => (
  <span className={cn("relative inline-flex size-4 shrink-0", className)}>
    <input
      type="checkbox"
      checked={checked}
      /*
        `peer` com opacidade zero, e não `sr-only`: escondido de verdade, o
        navegador tira o elemento do fluxo e o clique passa a depender do
        rótulo em volta. Por cima da caixa, ele continua sendo o alvo do
        ponteiro — o desenho embaixo é só desenho.
      */
      className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
      {...props}
    />

    <span
      aria-hidden
      className={cn(
        "pointer-events-none flex size-4 items-center justify-center rounded border transition",
        "border-ink-faint/60 bg-transparent",
        "peer-hover:border-ink-faint",
        "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white",
        /// O anel de foco fica no desenho porque o input é invisível — sem
        /// isto, navegar por teclado até aqui não mostraria nada.
        "peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-2",
        "peer-disabled:opacity-40",
        /*
          O sinal de marcado mora DENTRO desta caixa, e `peer-checked:` só
          alcança irmãos do input — não netos. Por isso o alvo é escrito à mão
          (`[&>svg]`): daqui a regra vira `.peer:checked ~ .esta-caixa > svg`,
          que é o que precisa acontecer.
        */
        "[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
      )}
    >
      <Check size={11} strokeWidth={3.5} className="transition-opacity" />
    </span>
  </span>
);
