import React from "react";
import { Check } from "lucide-react";

import { cn } from "~/lib/utils";

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
  <span data-gc="ui.checkbox.span" className={cn("relative inline-flex size-4 shrink-0", className)}>
    <input data-gc="ui.checkbox.input"
      type="checkbox"
      checked={checked}
      className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
      {...props}
    />

    <span data-gc="ui.checkbox.span--2"
      aria-hidden
      className={cn(
        "pointer-events-none flex size-4 items-center justify-center rounded border transition",
        "border-ink-faint/60 bg-transparent",
        "peer-hover:border-ink-faint",
        "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white",
        "peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-2",
        "peer-disabled:opacity-40",
        "[&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
      )}
    >
      <Check data-gc="ui.checkbox.check" size={11} strokeWidth={3.5} className="transition-opacity" />
    </span>
  </span>
);
