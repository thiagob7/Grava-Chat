import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "~/lib/utils";
import { flxCls } from "~/lib/compat-de-tema";

export const fieldBase =
  `${flxCls("molduraDoCampo")} ${flxCls("superficieDeCampo")} ` +
  "w-full min-w-0 rounded-lg border border-line bg-campo px-3 py-2 text-sm text-ink shadow-xs outline-none transition placeholder:text-ink-faint focus-visible:border-ink-faint/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
}

export const Input = ({ className, error, type, id, ...props }: InputProps) => {
  const [mostrando, setMostrando] = React.useState(false);
  const generatedId = React.useId();
  const idDoErro = `${id ?? generatedId}-erro`;
  const ehSenha = type === "password";

  const fieldClass = (
    <input data-gc="ui.input.input"
      id={id}
      type={ehSenha && mostrando ? "text" : type}
      aria-invalid={error ? true : props["aria-invalid"]}
      aria-describedby={error ? idDoErro : props["aria-describedby"]}
      className={cn(fieldBase, "h-10 py-1", ehSenha && "pr-10", flxCls("campo"), className)}
      {...props}
    />
  );

  if (!error && !ehSenha) return fieldClass;

  return (
    <div data-gc="ui.input.div" className="w-full">
      <div data-gc="ui.input.div--2" className="relative">
        {fieldClass}

        {ehSenha && (
          <button data-gc="ui.input.button"
            type="button"
            onClick={() => setMostrando((v) => !v)}
            aria-label={mostrando ? "Esconder a senha" : "Mostrar a senha"}
            aria-pressed={mostrando}
            className={cn(
              flxCls("olhoDaSenha"),
              "absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-ink-faint transition hover:text-ink",
            )}
          >
            {mostrando ? <EyeOff data-gc="ui.input.eye-off" size={16} /> : <Eye data-gc="ui.input.eye" size={16} />}
          </button>
        )}
      </div>

      {error && (
        <p data-gc="ui.input.p" id={idDoErro} className={cn(flxCls("erroDoCampo"), "mt-1 text-xs text-danger")}>
          {error}
        </p>
      )}
    </div>
  );
};

export const Textarea = ({ className, ...props }: React.ComponentProps<"textarea">) => (
  <textarea data-gc="ui.input.textarea"
    className={cn(fieldBase, "resize-none", flxCls("campo"), className)}
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

export const FieldWithAction: React.FC<
  React.ComponentProps<"input"> & { action: React.ReactNode }
> = ({ action, className, ...props }) => (
  <div data-gc="ui.input.div--3"
    className={cn(
      "flex items-center gap-2 rounded-lg border border-line bg-campo p-1.5 pl-3 transition",
      "focus-within:border-ink-faint/40",
    )}
  >
    <input data-gc="ui.input.input--2" className={cn(bareField, "h-8", className)} {...props} />
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
    <div data-gc="ui.input.div--4" className="flex gap-2">
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
