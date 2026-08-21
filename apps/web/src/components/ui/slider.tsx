import * as React from "react";

import { cn } from "~/lib/utils";

interface SliderProps extends Omit<React.ComponentProps<"input">, "type"> {
  /** 0..1 — quanto da barra fica preenchido à esquerda do controle */
  preenchido: number;
}

/**
 * Range nativo com a pista pintada até o valor. Nativo de propósito: teclado,
 * leitor de tela e arrastar com o dedo já vêm prontos, e o que faltava era só
 * a aparência.
 */
export const Slider = ({ className, preenchido, ...props }: SliderProps) => (
  <input
    type="range"
    className={cn(
      "h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none",
      "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
      "[&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow",
      "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink",
      className,
    )}
    style={{
      background: `linear-gradient(to right, var(--color-brand) ${preenchido * 100}%, var(--color-surface-4) ${preenchido * 100}%)`,
    }}
    {...props}
  />
);
