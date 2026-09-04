import React, { useRef, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import type { Role } from "@gravae/shared";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface SeletorDeCargosProps {
  disponiveis: Role[];
  atuais: string[];
  onAlternar: (roleId: string) => void;
  desabilitado?: boolean;
}

const BUSCA_A_PARTIR_DE = 8;

export const SeletorDeCargos: React.FC<SeletorDeCargosProps> = ({
  disponiveis,
  atuais,
  onAlternar,
  desabilitado = false,
}) => {
  const { t } = useTranslation();
  const [busca, setBusca] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);

  const tem = new Set(atuais);
  const comBusca = disponiveis.length > BUSCA_A_PARTIR_DE;

  const termo = busca.trim().toLowerCase();
  const lista = [...disponiveis]
    .sort((a, b) => b.position - a.position)
    .filter((cargo) => !termo || cargo.name.toLowerCase().includes(termo));

  const navegar = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

    const botoes = [...(listaRef.current?.querySelectorAll("button") ?? [])];
    if (!botoes.length) return;

    e.preventDefault();

    const atual = botoes.indexOf(document.activeElement as HTMLButtonElement);
    const passo = e.key === "ArrowDown" ? 1 : -1;
    const proximo = atual < 0 ? (passo > 0 ? 0 : botoes.length - 1) : atual + passo;

    botoes[(proximo + botoes.length) % botoes.length]?.focus();
  };

  return (
    <Popover onOpenChange={(aberto) => !aberto && setBusca("")}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={desabilitado}
          aria-label={t("perfil.cargos.adicionar")}
          title={t("perfil.cargos.adicionar")}
          className="flex size-[22px] items-center justify-center rounded bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
        >
          <Plus size={14} />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-60 p-1.5" onKeyDown={navegar}>
        {comBusca && (
          <div className="mb-1 flex items-center gap-2 rounded bg-surface-1 px-2">
            <Search size={13} className="shrink-0 text-ink-faint" />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t("perfil.cargos.procurar")}
              aria-label={t("perfil.cargos.procurar")}
              className="w-full bg-transparent py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
        )}

        <div ref={listaRef} className="max-h-56 overflow-y-auto">
          {lista.map((cargo) => (
            <button
              key={cargo.id}
              type="button"
              disabled={desabilitado}
              onClick={() => onAlternar(cargo.id)}
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-sm text-ink-muted outline-none transition",
                "hover:bg-brand hover:text-white focus-visible:bg-brand focus-visible:text-white",
                "disabled:cursor-default disabled:opacity-50",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {cargo.iconEmoji ? (
                  <span className="leading-none">{cargo.iconEmoji}</span>
                ) : cargo.iconUrl ? (
                  <img src={cargo.iconUrl} alt="" className="size-3.5 rounded-sm object-cover" />
                ) : (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cargo.color ?? "var(--color-ink-faint)" }}
                  />
                )}
                <span className="min-w-0 truncate">{cargo.name}</span>
              </span>

              {tem.has(cargo.id) && <Check size={14} className="shrink-0" />}
            </button>
          ))}

          {!lista.length && (
            <p className="px-2.5 py-2 text-sm text-ink-faint">
              {termo ? "Nenhum cargo com esse nome" : "Nenhum cargo pra dar"}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
