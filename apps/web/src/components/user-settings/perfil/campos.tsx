import React from "react";
import { X } from "lucide-react";

import type { Opcao } from "~/lib/cosmeticos/catalogo";
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
  <div>
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={valor ?? padrao}
        onChange={(e) => onMudar(e.target.value)}
        className={cn(campoDeCor, "size-9")}
        aria-label={label}
      />
      <span className="flex-1 font-mono text-xs text-ink-faint">{valor ?? "herdada"}</span>
      {valor && (
        <button
          type="button"
          onClick={() => onMudar(null)}
          className="rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
          aria-label={`Limpar ${label.toLowerCase()}`}
        >
          <X size={14} />
        </button>
      )}
    </div>
    {dica && <p className="mt-1 text-xs text-ink-faint">{dica}</p>}
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
    <div>
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {opcoes.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            onClick={() => onEscolher(opcao.id)}
            title={opcao.descricao}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded border px-2 py-2.5 text-xs transition",
              valor === opcao.id
                ? "border-brand bg-surface-3 text-ink"
                : "border-line bg-surface-0 text-ink-muted hover:bg-surface-3 hover:text-ink",
            )}
          >
            {amostra && <span className="flex h-8 items-center justify-center">{amostra(opcao.id)}</span>}
            <span className="truncate">{opcao.rotulo}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
