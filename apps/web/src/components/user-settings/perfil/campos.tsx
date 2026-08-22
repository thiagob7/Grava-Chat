import React from "react";
import { X } from "lucide-react";

import type { Opcao } from "~/lib/cosmeticos/catalogo";
import { Label } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface CampoDeCorProps {
  label: string;
  valor: string | null | undefined;
  onMudar: (cor: string | null) => void;
  /** o que mostrar quando não há escolha — normalmente a cor herdada do cargo */
  padrao?: string;
  dica?: string;
}

/**
 * Um seletor de cor com botão de limpar.
 *
 * O "limpar" não é enfeite de interface: **sem cor escolhida** é um estado
 * diferente de "cor preta". É ele que faz o efeito herdar a cor do cargo, que
 * é como a hierarquia do servidor sobrevive a todo mundo enfeitando o nome. Um
 * `<input type="color">` sozinho não tem como voltar pra esse estado.
 */
export const CampoDeCor: React.FC<CampoDeCorProps> = ({ label, valor, onMudar, padrao = "#a8a8b3", dica }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={valor ?? padrao}
        onChange={(e) => onMudar(e.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded border border-line bg-surface-0 p-1"
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
  /** desenha uma amostra do enfeite dentro do botão */
  amostra?: (id: T) => React.ReactNode;
}

/**
 * A grade de escolha de um enfeite.
 *
 * Uma grade e não um `<select>` porque a decisão aqui é visual: ninguém escolhe
 * "aurora" lendo a palavra aurora. A amostra dentro do botão é o próprio CSS do
 * catálogo, então nunca fica devendo pro resultado.
 */
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
