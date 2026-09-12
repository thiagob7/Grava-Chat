import React from "react";
import { Check, X } from "lucide-react";

import type { Choice } from "~/features/perfil/lib/catalogo";
import { ColorField as ColorPicker } from "~/components/ui/color-picker";
import { Label } from "~/components/ui/input";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface ColorPropsField {
  label: string;
  value: string | null | undefined;
  onChange: (color: string | null) => void;
  fallback?: string;
  hint?: string;
}

/*
  O quadradinho abre o seletor da casa — o mesmo do estúdio de temas, com
  matiz, opacidade e conta-gotas. Era o `input type="color"` do navegador, que
  abre a janela do sistema operacional e ignora o resto do app.

  O xadrez atrás da cor é para a opacidade aparecer no próprio quadradinho.
*/
export const ColorField: React.FC<ColorPropsField> = ({ label, value, onChange, fallback = "#a8a8b3", hint }) => (
  <div data-gc="configuracoes.perfil.campos.div">
    <Label data-gc="configuracoes.perfil.campos.label">{label}</Label>
    <div data-gc="configuracoes.perfil.campos.div--2" className="flex items-center gap-2">
      <Popover data-gc="configuracoes.perfil.campos.popover">
        <PopoverTrigger data-gc="configuracoes.perfil.campos.popover-trigger" asChild>
          <button data-gc="configuracoes.perfil.campos.button"
            type="button"
            aria-label={label}
            style={{
              backgroundImage: `linear-gradient(${value ?? fallback}, ${value ?? fallback}),
                repeating-conic-gradient(rgb(255 255 255 / 0.14) 0 25%, transparent 0 50%)`,
              backgroundSize: "auto, 8px 8px",
            }}
            className="size-9 shrink-0 cursor-pointer rounded-md border border-line-sutil transition hover:border-line"
          />
        </PopoverTrigger>

        <PopoverContent data-gc="configuracoes.perfil.campos.popover-content" align="start" className="w-60 p-3">
          <PopoverArrow data-gc="configuracoes.perfil.campos.popover-arrow" />
          <ColorPicker data-gc="configuracoes.perfil.campos.color-picker.on-change" value={value ?? fallback} onChange={onChange} />
        </PopoverContent>
      </Popover>

      <span data-gc="configuracoes.perfil.campos.span" className="flex-1 font-mono text-xs text-ink-faint">{value ?? "herdada"}</span>
      {value && (
        <button data-gc="configuracoes.perfil.campos.button--2"
          type="button"
          onClick={() => onChange(null)}
          className="rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
          aria-label={`Limpar ${label.toLowerCase()}`}
        >
          <X data-gc="configuracoes.perfil.campos.x" size={14} />
        </button>
      )}
    </div>
    {hint && <p data-gc="configuracoes.perfil.campos.p" className="mt-1 text-xs text-ink-faint">{hint}</p>}
  </div>
);

interface OptionsPropsGrid<T extends string> {
  label: string;
  options: Choice<T>[];
  value: T | undefined;
  onPick: (id: T) => void;
  sample?: (id: T) => React.ReactNode;
}

export function OptionsGrid<T extends string>({
  label,
  options,
  value,
  onPick,
  sample,
}: OptionsPropsGrid<T>) {
  return (
    <div data-gc="configuracoes.perfil.campos.div--3">
      <Label data-gc="configuracoes.perfil.campos.label--2">{label}</Label>
      <div data-gc="configuracoes.perfil.campos.div--4" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button data-gc="configuracoes.perfil.campos.button--2"
            key={option.id}
            type="button"
            onClick={() => onPick(option.id)}
            title={option.description}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs transition",
              value === option.id
                ? "border-brand bg-surface-3 font-medium text-ink shadow-[0_0_0_1px_var(--color-brand)]"
                : "border-line bg-surface-0 text-ink-muted hover:border-line-sutil hover:bg-surface-3 hover:text-ink",
            )}
          >
            {value === option.id && (
              <span data-gc="configuracoes.perfil.campos.span--2"
                aria-hidden
                className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-sobre-marca shadow-md shadow-sombra"
              >
                <Check data-gc="configuracoes.perfil.campos.check" size={11} strokeWidth={3} />
              </span>
            )}

            {sample && <span data-gc="configuracoes.perfil.campos.span--3" className="flex h-8 items-center justify-center">{sample(option.id)}</span>}
            <span data-gc="configuracoes.perfil.campos.span--4" className="text-center leading-tight">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
