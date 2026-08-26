import * as React from "react";

import { cn } from "~/lib/utils";

export const campoBase =
  "w-full min-w-0 rounded-lg border border-line bg-campo px-3 py-2 text-sm text-ink shadow-xs outline-none transition-colors placeholder:text-ink-faint focus-visible:border-campo-foco disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

export const Input = ({ className, ...props }: React.ComponentProps<"input">) => (
  <input className={cn(campoBase, "h-10 py-1", className)} {...props} />
);

export const Textarea = ({ className, ...props }: React.ComponentProps<"textarea">) => (
  <textarea className={cn(campoBase, "resize-none", className)} {...props} />
);

export const campoDeCor =
  "shrink-0 cursor-pointer rounded-lg border border-white/5 bg-campo p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const grupoDeCampo =
  "flex h-10 items-center gap-2 rounded-lg border border-white/5 bg-campo px-3 transition-colors focus-within:border-campo-foco";

export const campoNu =
  "h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-ink shadow-none outline-none placeholder:text-ink-faint focus-visible:border-0";

export const cartaoDeEscolha = (escolhido: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
    escolhido
      ? "border-brand/60 bg-surface-3"
      : "border-white/5 bg-campo hover:border-white/10 hover:bg-surface-3/60",
  );

export const Label = ({ className, ...props }: React.ComponentProps<"label">) => (
  <label
    className={cn("mb-1.5 block text-xs font-semibold uppercase text-ink-muted", className)}
    {...props}
  />
);

interface OpcaoEmCartaoProps {
  escolhido: boolean;
  onEscolher: () => void;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  icone?: React.ReactNode;
}

export const OpcaoEmCartao: React.FC<OpcaoEmCartaoProps> = ({
  escolhido,
  onEscolher,
  titulo,
  descricao,
  icone,
}) => (
  <button type="button" onClick={onEscolher} className={cartaoDeEscolha(escolhido)}>
    {icone}
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium">{titulo}</span>
      {descricao && <span className="mt-0.5 block text-xs text-ink-faint">{descricao}</span>}
    </span>
    <span
      aria-hidden
      className={cn(
        "mt-0.5 size-4 shrink-0 rounded-full border-2 transition-colors",
        escolhido ? "border-brand bg-brand" : "border-ink-faint",
      )}
    />
  </button>
);

interface GrupoSegmentadoProps<T extends string> {
  valor: T;
  onEscolher: (valor: T) => void;
  opcoes: { valor: T; rotulo: string }[];
}

export function GrupoSegmentado<T extends string>({
  valor,
  onEscolher,
  opcoes,
}: GrupoSegmentadoProps<T>) {
  return (
    <div className="flex gap-2">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onEscolher(o.valor)}
          className={cn(
            "h-10 flex-1 rounded-lg border text-sm transition-colors",
            valor === o.valor
              ? "border-brand/60 bg-surface-3 text-ink"
              : "border-white/5 bg-campo text-ink-muted hover:border-white/10 hover:text-ink",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
