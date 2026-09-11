import * as React from "react";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

export const RadioIndicator: React.FC<{ selected: boolean; className?: string }> = ({
  selected,
  className,
}) => (
  <span data-gc="ui.radio-group.span"
    aria-hidden
    className={cn(flxCls("radioIndicator"), "block size-4 shrink-0", className)}
  >
    <svg data-gc="ui.radio-group.svg" viewBox="0 0 16 16" className="size-full">
      <circle data-gc="ui.radio-group.circle"
        className={flxCls("baseDoRadio")}
        cx="8"
        cy="8"
        r="7"
        fill="none"
        strokeWidth="1.5"
        stroke={selected ? "var(--color-brand)" : "var(--color-surface-4)"}
      />
      <circle data-gc="ui.radio-group.circle--2"
        className={flxCls("radioDot")}
        cx="8"
        cy="8"
        r="4"
        fill={selected ? "var(--color-brand)" : "transparent"}
      />
    </svg>
  </span>
);

export const radioOptionClass = () => flxCls("radioOption");

export const radioGroupClass = () => flxCls("radioGroup");
