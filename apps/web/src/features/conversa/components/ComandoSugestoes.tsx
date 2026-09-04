import React from "react";
import type { ComandoDisponivel, OpcaoDeComando } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { cn } from "~/lib/utils";

const assinatura = (opcoes: OpcaoDeComando[]) =>
  opcoes.map((o) => (o.obrigatoria ? `<${o.nome}>` : `[${o.nome}]`)).join(" ");

interface ComandoSugestoesProps {
  itens: ComandoDisponivel[];
  indice: number;
  onEscolher: (item: ComandoDisponivel) => void;
  onPassarMouse: (indice: number) => void;
}

export const ComandoSugestoes: React.FC<ComandoSugestoesProps> = ({
  itens,
  indice,
  onEscolher,
  onPassarMouse,
}) => {
  if (!itens.length) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg bg-surface-1 shadow-2xl ring-1 ring-line">
      <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Comandos
      </p>

      <ul className="max-h-72 overflow-y-auto p-1.5">
        {itens.map((item, i) => (
          <li key={`${item.botId}-${item.nome}`}>
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
              <span className="shrink-0 font-medium text-ink">/{item.nome}</span>

              {item.opcoes.length > 0 && (
                <span className="shrink-0 font-mono text-xs text-ink-faint">
                  {assinatura(item.opcoes)}
                </span>
              )}

              <span className="min-w-0 flex-1 truncate text-xs text-ink-faint">
                {item.descricao}
              </span>

              <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-faint">
                <Avatar
                  id={item.bot.id}
                  name={item.bot.displayName}
                  url={item.bot.avatarUrl}
                  size={16}
                />
                {item.bot.displayName}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const DicaDoComando: React.FC<{
  comando: ComandoDisponivel;
  preenchidas: Record<string, string>;
  faltando: OpcaoDeComando[];
}> = ({ comando, preenchidas, faltando }) => {
  const atual = comando.opcoes.find((o) => !preenchidas[o.nome]) ?? null;

  return (
    <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg bg-surface-1 shadow-2xl ring-1 ring-line">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
        <span className="font-medium text-ink">/{comando.nome}</span>

        {comando.opcoes.map((opcao) => (
          <span
            key={opcao.nome}
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-xs transition",
              opcao.nome === atual?.nome
                ? "bg-brand/20 text-brand"
                : preenchidas[opcao.nome]
                  ? "text-ink-muted"
                  : "text-ink-faint",
            )}
          >
            {opcao.obrigatoria ? `<${opcao.nome}>` : `[${opcao.nome}]`}
          </span>
        ))}

        <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-faint">
          <Avatar
            id={comando.bot.id}
            name={comando.bot.displayName}
            url={comando.bot.avatarUrl}
            size={16}
          />
          {comando.bot.displayName}
        </span>
      </div>

      <p className="border-t border-line px-3 py-1.5 text-xs text-ink-faint">
        {atual ? (
          <>
            <span className="font-medium text-ink-muted">{atual.nome}</span> — {atual.descricao}
          </>
        ) : (
          comando.descricao
        )}
      </p>

      {faltando.length > 0 && (
        <p className="border-t border-line bg-danger/10 px-3 py-1.5 text-xs text-danger">
          Falta {faltando.map((o) => o.nome).join(", ")}.
        </p>
      )}
    </div>
  );
};
