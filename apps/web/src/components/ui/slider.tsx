import * as React from "react";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

interface SliderProps extends Omit<React.ComponentProps<"input">, "type"> {
  preenchido: number;
  /// Onde fica o valor de fábrica, de 0 a 1. Sem isso, nenhuma marca é desenhada.
  padrao?: number;
  /// O que escrever embaixo da marca. Sem isso, só o risquinho.
  rotuloDoPadrao?: string;
}

/*
  Quatro elementos desenham, e o `<input type="range">` invisível manda.

  A árvore é a da referência — `control > sliderControl > track > barFill`, com o
  `grabber` ao lado do trilho — porque os temas encadeiam esses nomes e cadeia
  não casa com nome no mesmo elemento. O `<input>` fica por cima, transparente,
  e continua sendo quem ouve arraste, teclado e leitor de tela: assim a árvore
  muda e o comportamento não, inclusive no volume da chamada, que vive girado
  90° e onde refazer o arraste na mão seria caro.

  O input vem ANTES no DOM para o `group-focus-within` alcançar o punho — e as
  camadas de desenho são `pointer-events-none`, senão elas roubariam o clique
  de quem está por baixo.
*/
export const Slider = ({
  className,
  preenchido,
  padrao,
  rotuloDoPadrao,
  ...props
}: SliderProps) => {
  const posicao = `${Math.min(Math.max(preenchido, 0), 1) * 100}%`;

  return (
    <div data-gc="ui.slider.div"
      className={cn(
        flxCls("controleDoSlider"),
        "group/slider relative h-1.5 w-full",
        props.disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input data-gc="ui.slider.input"
        type="range"
        className="absolute inset-0 size-full cursor-pointer appearance-none bg-transparent opacity-0 outline-none"
        {...props}
      />

      <div data-gc="ui.slider.div--2"
        className={cn(flxCls("mioloDoSlider"), "pointer-events-none relative size-full")}
      >
        <div data-gc="ui.slider.div--3"
          className={cn(
            flxCls("trilhoDoSlider"),
            "absolute inset-0 overflow-hidden rounded-full bg-trilho",
          )}
        >
          <div data-gc="ui.slider.div--4"
            className={cn(flxCls("preenchimentoDoSlider"), "h-full rounded-full bg-brand")}
            style={{ width: posicao }}
          />
        </div>

        <div data-gc="ui.slider.div--5"
          className={cn(
            flxCls("punhoDoSlider"),
            "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink shadow",
            "group-focus-within/slider:ring-2 group-focus-within/slider:ring-brand",
          )}
          style={{ left: posicao }}
        />
      </div>

      {padrao !== undefined && (
        <span data-gc="ui.slider.span"
          className={cn(
            flxCls("marcaDoPadrao"),
            "pointer-events-none absolute top-full -translate-x-1/2 text-center",
          )}
          style={{ left: `${Math.min(Math.max(padrao, 0), 1) * 100}%` }}
        >
          <span data-gc="ui.slider.span--2"
            aria-hidden
            className={cn(flxCls("risquinhoDaMarca"), "mx-auto block h-1 w-px bg-ink-faint")}
          />
          {rotuloDoPadrao && (
            <span data-gc="ui.slider.span--3"
              className={cn(
                flxCls("numeroDaMarca"),
                "block text-10 tabular-nums text-ink-faint",
              )}
            >
              {rotuloDoPadrao}
            </span>
          )}
        </span>
      )}
    </div>
  );
};
