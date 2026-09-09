import * as React from "react";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

interface SliderProps extends Omit<React.ComponentProps<"input">, "type"> {
  filled: number;
  defaultAt?: number;
  defaultLabel?: string;
}

export const Slider = ({
  className,
  filled,
  defaultAt,
  defaultLabel,
  ...props
}: SliderProps) => {
  const position = `${Math.min(Math.max(filled, 0), 1) * 100}%`;

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
            style={{ width: position }}
          />
        </div>

        <div data-gc="ui.slider.div--5"
          className={cn(
            flxCls("punhoDoSlider"),
            "absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink shadow",
            "group-focus-within/slider:ring-2 group-focus-within/slider:ring-brand",
          )}
          style={{ left: position }}
        />
      </div>

      {defaultAt !== undefined && (
        <span data-gc="ui.slider.span"
          className={cn(
            flxCls("marcaDoPadrao"),
            "pointer-events-none absolute top-full -translate-x-1/2 text-center",
          )}
          style={{ left: `${Math.min(Math.max(defaultAt, 0), 1) * 100}%` }}
        >
          <span data-gc="ui.slider.span--2"
            aria-hidden
            className={cn(flxCls("risquinhoDaMarca"), "mx-auto block h-1 w-px bg-ink-faint")}
          />
          {defaultLabel && (
            <span data-gc="ui.slider.span--3"
              className={cn(
                flxCls("numeroDaMarca"),
                "block text-10 tabular-nums text-ink-faint",
              )}
            >
              {defaultLabel}
            </span>
          )}
        </span>
      )}
    </div>
  );
};
