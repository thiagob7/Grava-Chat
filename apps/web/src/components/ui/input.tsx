import * as React from "react";
import { Eye, EyeOff, Search, X } from "lucide-react";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

export const fieldBase =
  `${flxCls("fieldFrame")} ${flxCls("fieldSurface")} ` +
  "w-full min-w-0 rounded-lg border border-line bg-campo px-3 py-2 text-sm text-ink shadow-xs outline-none transition placeholder:text-ink-faint focus-visible:border-ink-faint/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
}

export const Input = ({ className, error, type, id, ...props }: InputProps) => {
  const [showing, setShowing] = React.useState(false);
  const generatedId = React.useId();
  const errorId = `${id ?? generatedId}-erro`;
  const isPassword = type === "password";

  const fieldClass = (
    <input data-gc="ui.input.input"
      id={id}
      type={isPassword && showing ? "text" : type}
      aria-invalid={error ? true : props["aria-invalid"]}
      aria-describedby={error ? errorId : props["aria-describedby"]}
      className={cn(fieldBase, "h-10 py-1", isPassword && "pr-10", flxCls("field"), className)}
      {...props}
    />
  );

  if (!error && !isPassword) return fieldClass;

  return (
    <div data-gc="ui.input.div" className="w-full">
      <div data-gc="ui.input.div--2" className="relative">
        {fieldClass}

        {isPassword && (
          <button data-gc="ui.input.button"
            type="button"
            onClick={() => setShowing((v) => !v)}
            aria-label={showing ? "Esconder a senha" : "Mostrar a senha"}
            aria-pressed={showing}
            className={cn(
              flxCls("passwordEye"),
              "absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-ink-faint transition hover:text-ink",
            )}
          >
            {showing ? <EyeOff data-gc="ui.input.eye-off" size={16} /> : <Eye data-gc="ui.input.eye" size={16} />}
          </button>
        )}
      </div>

      {error && (
        <p data-gc="ui.input.p" id={errorId} className={cn(flxCls("fieldError"), "mt-1 text-xs text-danger")}>
          {error}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({ className, ...props }: React.ComponentProps<"textarea">) => (
  <textarea data-gc="ui.input.textarea"
    className={cn(fieldBase, "resize-none", flxCls("field"), className)}
    {...props}
  />
);

export const colorFieldClass =
  "shrink-0 cursor-pointer rounded-lg border border-line-sutil bg-campo p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const fieldGroup =
  `${flxCls("fieldGroup")} ` +
  "flex h-10 items-center gap-2 rounded-lg border border-line-sutil bg-campo px-3 transition focus-within:border-ink-faint/40";

export const bareField =
  "h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink shadow-none outline-none placeholder:text-ink-faint focus-visible:border-0";

export const FieldGroup = ({ className, ...props }: React.ComponentProps<"div">) => (
  <div data-gc="ui.input.div--3" className={cn(fieldGroup, className)} {...props} />
);

export const BareInput = ({ className, ...props }: React.ComponentProps<"input">) => (
  <input data-gc="ui.input.input--2" className={cn(bareField, className)} {...props} />
);

export const BareTextarea = ({ className, ...props }: React.ComponentProps<"textarea">) => (
  <textarea data-gc="ui.input.textarea--2" className={cn(bareField, "resize-none", className)} {...props} />
);

export const FieldWithAction: React.FC<
  React.ComponentProps<"input"> & { action: React.ReactNode }
> = ({ action, className, ...props }) => (
  <div data-gc="ui.input.div--4"
    className={cn(
      "flex items-center gap-2 rounded-lg border border-line bg-campo p-1.5 pl-3 transition",
      "focus-within:border-ink-faint/40",
    )}
  >
    <input data-gc="ui.input.input--3" className={cn(bareField, "h-8", className)} {...props} />
    {action}
  </div>
);

export const choiceCard = (selected: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
    selected
      ? "border-brand bg-brand/10 text-ink"
      : "border-line-sutil bg-campo hover:border-line-sutil hover:bg-surface-3/60",
  );

export const Label = ({ className, ...props }: React.ComponentProps<"label">) => (
  <label data-gc="ui.input.label"
    className={cn("mb-1.5 block text-xs font-semibold uppercase text-ink-muted", className)}
    {...props}
  />
);

interface CardOptionProps {
  selected: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardOption: React.FC<CardOptionProps> = ({
  selected,
  onSelect,
  title,
  description,
  icon,
}) => (
  <button data-gc="ui.input.button.on-select" type="button" onClick={onSelect} className={choiceCard(selected)}>
    {icon}
    <span data-gc="ui.input.span" className="min-w-0 flex-1">
      <span data-gc="ui.input.span--2" className="block text-sm font-medium">{title}</span>
      {description && <span data-gc="ui.input.span--3" className="mt-0.5 block text-xs text-ink-faint">{description}</span>}
    </span>
    <span data-gc="ui.input.span--4"
      aria-hidden
      className={cn(
        "mt-0.5 size-4 shrink-0 rounded-full border-2 transition-colors",
        selected ? "border-brand bg-brand" : "border-ink-faint",
      )}
    />
  </button>
);

interface SegmentedGroupProps<T extends string> {
  value: T;
  onSelect: (value: T) => void;
  options: { value: T; label: string }[];
}

export function SegmentedGroup<T extends string>({
  value,
  onSelect,
  options,
}: SegmentedGroupProps<T>) {
  return (
    <div data-gc="ui.input.div--5" className="flex gap-2">
      {options.map((o) => (
        <button data-gc="ui.input.button--2"
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className={cn(
            "h-10 flex-1 rounded-lg border text-sm transition-colors",
            value === o.value
              ? "border-brand bg-brand/10 text-ink"
              : "border-line-sutil bg-campo text-ink-muted hover:border-line-sutil hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/*
  Campo de busca de uma caixa só.

  O jeito antigo punha um Input (que tem borda e sombra) dentro de uma caixa com
  fundo, e o resultado eram duas caixas, uma dentro da outra. Aqui a caixa é a
  do grupo, e o campo por dentro não desenha nada.
*/
export const SearchField = ({
  className,
  iconClassName,
  onClear,
  ...props
}: React.ComponentProps<"input"> & { onClear?: () => void; iconClassName?: string }) => (
  <div data-gc="ui.input.div--6" className={cn(fieldGroup, className)}>
    <Search data-gc="ui.input.search" size={14} className={cn("shrink-0 text-ink-faint", iconClassName)} aria-hidden />
    <input data-gc="ui.input.input--4" type="text" className={bareField} {...props} />
    {onClear && props.value ? (
      <button data-gc="ui.input.button.on-clear"
        type="button"
        onClick={onClear}
        aria-label="Limpar a busca"
        className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
      >
        <X data-gc="ui.input.x" size={14} />
      </button>
    ) : null}
  </div>
);
