import * as React from "react";

import { cn } from "~/lib/utils";

interface SliderProps extends Omit<React.ComponentProps<"input">, "type"> {
  preenchido: number;
}

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
      /*
        O trecho vazio usa `--color-trilho`, e NÃO uma cor de superfície.

        Era `--color-surface-4` — que é justamente a cor dos menus. Dentro do
        painel de sons ou do menu de volume, o trilho sumia no fundo e a régua
        virava uma bolinha solta: dava pra arrastar, mas não pra ver até onde
        ela ia. Um cinza claro próprio enxerga em qualquer painel.
      */
      background: `linear-gradient(to right, var(--color-brand) ${preenchido * 100}%, var(--color-trilho) ${preenchido * 100}%)`,
    }}
    {...props}
  />
);
