import React from "react";
import { Plus, SlashSquare } from "lucide-react";
import { PERMISSION_LABELS, type AplicativoDescoberto, type Permission } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";

const nomeDaPermissao = (permissao: string) =>
  PERMISSION_LABELS[permissao as Permission]?.nome ?? permissao;

export const CartaoDeAplicativo: React.FC<{
  aplicativo: AplicativoDescoberto;
  onAdicionar: () => void;
}> = ({ aplicativo, onAdicionar }) => (
  <article data-gc="descoberta.cartao-de-aplicativo.article.on-adicionar"
    className="group flex cursor-pointer flex-col rounded-lg border border-line bg-surface-2 p-4 transition hover:border-ink-faint/30"
    onClick={onAdicionar}
  >
    <div data-gc="descoberta.cartao-de-aplicativo.div" className="flex items-center gap-3">
      <Avatar data-gc="descoberta.cartao-de-aplicativo.avatar"
        id={aplicativo.id}
        name={aplicativo.nome}
        url={aplicativo.avatarUrl}
        size={40}
      />

      <div data-gc="descoberta.cartao-de-aplicativo.div--2" className="min-w-0">
        <h3 data-gc="descoberta.cartao-de-aplicativo.h3" className="truncate text-sm font-semibold">{aplicativo.nome}</h3>
        <p data-gc="descoberta.cartao-de-aplicativo.p" className="truncate text-xs text-ink-faint">de {aplicativo.dono.displayName}</p>
      </div>
    </div>

    <p data-gc="descoberta.cartao-de-aplicativo.p--2" className="mt-3 line-clamp-3 text-xs text-ink-muted">
      {aplicativo.descricao ?? "Sem descrição."}
    </p>

    {aplicativo.permissoesPedidas.length > 0 && (
      <div data-gc="descoberta.cartao-de-aplicativo.div--3" className="mt-3 flex flex-wrap gap-1">
        {aplicativo.permissoesPedidas.slice(0, 3).map((permissao) => (
          <span data-gc="descoberta.cartao-de-aplicativo.span" key={permissao} className="rounded bg-surface-3 px-1.5 py-0.5 text-10 text-ink-faint">
            {nomeDaPermissao(permissao)}
          </span>
        ))}

        {aplicativo.permissoesPedidas.length > 3 && (
          <span data-gc="descoberta.cartao-de-aplicativo.span--2" className="rounded bg-surface-3 px-1.5 py-0.5 text-10 text-ink-faint">
            +{aplicativo.permissoesPedidas.length - 3}
          </span>
        )}
      </div>
    )}

    <div data-gc="descoberta.cartao-de-aplicativo.div--4" className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-ink-faint">
      <SlashSquare data-gc="descoberta.cartao-de-aplicativo.slash-square" size={14} />
      {aplicativo.comandos === 1 ? "1 comando" : `${aplicativo.comandos} comandos`}
    </div>

    <div data-gc="descoberta.cartao-de-aplicativo.div--5" className="mt-3">
      <Button data-gc="descoberta.cartao-de-aplicativo.button"
        size="sm"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          onAdicionar();
        }}
      >
        <Plus data-gc="descoberta.cartao-de-aplicativo.plus" size={14} /> Adicionar
      </Button>
    </div>
  </article>
);
