import React from "react";
import { AtSign, Users } from "lucide-react";

import { Avatar } from "~/components/Avatar";
import type { Mencionavel } from "~/hooks/use-mencoes";
import { legivel } from "~/lib/cosmeticos/contraste";
import { cn } from "~/lib/utils";

interface MencaoSugestoesProps {
  itens: Mencionavel[];
  indice: number;
  onEscolher: (item: Mencionavel) => void;
  onPassarMouse: (indice: number) => void;
}

export const MencaoSugestoes: React.FC<MencaoSugestoesProps> = ({
  itens,
  indice,
  onEscolher,
  onPassarMouse,
}) => {
  if (!itens.length) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg bg-surface-1 shadow-2xl ring-1 ring-line">
      <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Membros e cargos
      </p>

      <ul className="max-h-72 overflow-y-auto p-1.5">
        {itens.map((item, i) => (
          <li key={`${item.tipo}-${item.id}`}>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onEscolher(item);
              }}
              onMouseEnter={() => onPassarMouse(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                i === indice ? "bg-surface-3 text-ink" : "text-ink-muted",
              )}
            >
              {item.tipo === "usuario" ? (
                <Avatar id={item.id} name={item.nome} url={item.avatarUrl} size={20} />
              ) : (
                <span
                  className="flex size-5 items-center justify-center rounded-full bg-surface-3"
                  style={item.cor ? { color: legivel(item.cor) } : undefined}
                >
                  {item.tipo === "cargo" ? <Users size={12} /> : <AtSign size={12} />}
                </span>
              )}

              <span
                className="min-w-0 truncate font-medium"
                style={item.cor ? { color: legivel(item.cor) } : undefined}
              >
                {item.nome}
              </span>

              {item.detalhe && (
                <span className="min-w-0 truncate text-xs text-ink-faint">{item.detalhe}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
