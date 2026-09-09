import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { flxAttr, flxCls } from "~/lib/compat-de-tema";

export interface ComboboxOption<T extends string | number> {
  value: T;
  label: string;
}

interface ComboboxProps<T extends string | number> {
  id?: string;
  value: T;
  onSelect: (value: T) => void;
  options: ComboboxOption<T>[];
  placeholder?: string;
  empty?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox<T extends string | number>({
  id,
  value,
  onSelect,
  options,
  placeholder,
  empty = "Nada encontrado.",
  disabled,
  className,
}: ComboboxProps<T>) {
  const [open, setAberto] = React.useState(false);
  const [filtro, setFiltro] = React.useState<string | null>(null);
  const [ativo, setAtivo] = React.useState(0);
  const fieldClass = React.useRef<HTMLInputElement>(null);
  const anchor = React.useRef<HTMLDivElement>(null);

  const chosen = options.find((o) => o.value === value);
  const digitando = filtro !== null;

  const filtered = React.useMemo(() => {
    const termo = (filtro ?? "").trim().toLowerCase();
    if (!termo) return options;

    return options.filter((o) => o.label.toLowerCase().includes(termo));
  }, [options, filtro]);

  const abrirEm = (index: number) => {
    setAberto(true);
    setAtivo(index);
  };

  const close = () => {
    setAberto(false);
    setFiltro(null);
  };

  const commit = (choice: T) => {
    onSelect(choice);
    close();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!open) {
        abrirEm(Math.max(0, options.findIndex((o) => o.value === value)));
        return;
      }

      if (!filtered.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setAtivo((current) => (current + step + filtered.length) % filtered.length);
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      const target = filtered[ativo];
      if (target) commit(target.value);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
  };

  return (
    <Popover data-gc="ui.combobox.popover" open={open} onOpenChange={(proximo) => (proximo ? setAberto(true) : close())}>
      <PopoverAnchor data-gc="ui.combobox.popover-anchor" asChild>
        <div data-gc="ui.combobox.div"
          {...flxAttr("grupoDeCombo")}
          ref={anchor}
          className={cn(
            flxCls("grupoDeCombo"),
            "flex h-10 w-full items-center gap-2 rounded-lg border border-line bg-campo px-3 transition",
            "focus-within:border-ink-faint/40",
            disabled && "pointer-events-none opacity-50",
            className,
          )}
        >
          <input data-gc="ui.combobox.input.close"
            id={id}
            ref={fieldClass}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={digitando ? filtro : (chosen?.label ?? "")}
            onChange={(e) => {
              setFiltro(e.target.value);
              setAberto(true);
              setAtivo(0);
            }}
            onMouseDown={() => {
              if (!open) abrirEm(Math.max(0, options.findIndex((o) => o.value === value)));
            }}
            onBlur={close}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />

          <button data-gc="ui.combobox.button"
            type="button"
            tabIndex={-1}
            aria-hidden
            onMouseDown={(event) => {
              event.preventDefault();
              if (open) return close();

              fieldClass.current?.focus();
              abrirEm(Math.max(0, options.findIndex((o) => o.value === value)));
            }}
            className="shrink-0 text-ink-faint transition hover:text-ink"
          >
            <ChevronDown data-gc="ui.combobox.chevron-down"
              size={16}
              className={cn("transition-transform duration-200 ease-in-out", open && "rotate-180")}
            />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent data-gc="ui.combobox.popover-content"
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onFocusOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          const target = event.target;
          if (target instanceof Node && anchor.current?.contains(target)) event.preventDefault();
        }}
        className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto p-1 shadow-[0_0.5rem_1rem_rgb(0_0_0/0.24)]"
      >
        {!filtered.length && (
          <p data-gc="ui.combobox.p" className="px-2 py-3 text-center text-sm text-ink-muted">{empty}</p>
        )}

        {filtered.map((option, index) => {
          const selectedIndex = option.value === value;

          return (
            <button data-gc="ui.combobox.button--2"
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={selectedIndex}
              onMouseDown={(event) => {
                event.preventDefault();
                commit(option.value);
              }}
              onMouseMove={() => setAtivo(index)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                index === ativo ? "bg-brand text-sobre-marca" : "text-ink-muted",
              )}
            >
              <span data-gc="ui.combobox.span" className="min-w-0 flex-1 truncate">{option.label}</span>
              {selectedIndex && <Check data-gc="ui.combobox.check" size={14} className="shrink-0" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
