import React from "react";
import { Check, X } from "lucide-react";

import type { Opcao } from "~/features/perfil/lib/catalogo";
import { Label, campoDeCor } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface CampoDeCorProps {
  label: string;
  valor: string | null | undefined;
  onMudar: (cor: string | null) => void;
  padrao?: string;
  dica?: string;
}

export const CampoDeCor: React.FC<CampoDeCorProps> = ({ label, valor, onMudar, padrao = "#a8a8b3", dica }) => (
  <div data-gc="configuracoes.perfil.campos.div">
    <Label data-gc="configuracoes.perfil.campos.label">{label}</Label>
    <div data-gc="configuracoes.perfil.campos.div--2" className="flex items-center gap-2">
      <input data-gc="configuracoes.perfil.campos.input"
        type="color"
        value={valor ?? padrao}
        onChange={(e) => onMudar(e.target.value)}
        className={cn(campoDeCor, "size-9")}
        aria-label={label}
      />
      <span data-gc="configuracoes.perfil.campos.span" className="flex-1 font-mono text-xs text-ink-faint">{valor ?? "herdada"}</span>
      {valor && (
        <button data-gc="configuracoes.perfil.campos.button"
          type="button"
          onClick={() => onMudar(null)}
          className="rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
          aria-label={`Limpar ${label.toLowerCase()}`}
        >
          <X data-gc="configuracoes.perfil.campos.x" size={14} />
        </button>
      )}
    </div>
    {dica && <p data-gc="configuracoes.perfil.campos.p" className="mt-1 text-xs text-ink-faint">{dica}</p>}
  </div>
);

interface GradeDeOpcoesProps<T extends string> {
  label: string;
  opcoes: Opcao<T>[];
  valor: T | undefined;
  onEscolher: (id: T) => void;
  amostra?: (id: T) => React.ReactNode;
}

export function GradeDeOpcoes<T extends string>({
  label,
  opcoes,
  valor,
  onEscolher,
  amostra,
}: GradeDeOpcoesProps<T>) {
  return (
    <div data-gc="configuracoes.perfil.campos.div--3">
      <Label data-gc="configuracoes.perfil.campos.label--2">{label}</Label>
      <div data-gc="configuracoes.perfil.campos.div--4" className="grid grid-cols-3 gap-2">
        {opcoes.map((opcao) => (
          <button data-gc="configuracoes.perfil.campos.button--2"
            key={opcao.id}
            type="button"
            onClick={() => onEscolher(opcao.id)}
            title={opcao.descricao}
            className={cn(
              "relative flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs transition",
              valor === opcao.id
                ? "border-brand bg-surface-3 font-medium text-ink shadow-[0_0_0_1px_var(--color-brand)]"
                : "border-line bg-surface-0 text-ink-muted hover:border-white/10 hover:bg-surface-3 hover:text-ink",
            )}
          >
            {valor === opcao.id && (
              <span data-gc="configuracoes.perfil.campos.span--2"
                aria-hidden
                className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-black/40"
              >
                <Check data-gc="configuracoes.perfil.campos.check" size={11} strokeWidth={3} />
              </span>
            )}

            {amostra && <span data-gc="configuracoes.perfil.campos.span--3" className="flex h-8 items-center justify-center">{amostra(opcao.id)}</span>}
            <span data-gc="configuracoes.perfil.campos.span--4" className="text-center leading-tight">{opcao.rotulo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
