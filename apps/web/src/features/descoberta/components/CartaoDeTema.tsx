import React from "react";
import { Download } from "lucide-react";
import { CORES_DA_PREVIA, type TemaDaGaleria } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";

/*
  O cartão de um tema na galeria do Explorar.

  A prévia é uma fita das cores que o tema troca, na ordem em que a gente as
  procura — quem varreu a lista já sabe qual é o roxo e qual é o fundo antes
  de abrir. Tema que não mexeu em nenhuma delas não ganha fita: fita cinza
  seria mentir sobre o que ele faz.
*/
export const CartaoDeTemaDaGaleria: React.FC<{
  tema: TemaDaGaleria;
  onImportar: () => void;
}> = ({ tema, onImportar }) => {
  const cores = CORES_DA_PREVIA.map((token) => tema.substituicoes[token]).filter(Boolean);

  return (
    <article data-gc="descoberta.cartao-de-tema.article.on-importar"
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-surface-2 transition hover:border-ink-faint/30"
      onClick={onImportar}
    >
      <div data-gc="descoberta.cartao-de-tema.div" className="flex h-24 shrink-0 overflow-hidden bg-surface-4">
        {cores.length ? (
          cores.map((cor, i) => (
            <span data-gc="descoberta.cartao-de-tema.span" key={i} className="flex-1" style={{ backgroundColor: cor }} />
          ))
        ) : (
          <span data-gc="descoberta.cartao-de-tema.span--2" className="flex-1" />
        )}
      </div>

      <div data-gc="descoberta.cartao-de-tema.div--2" className="flex min-h-0 flex-1 flex-col p-4">
        <h3 data-gc="descoberta.cartao-de-tema.h3" className="flex items-baseline gap-1.5 text-sm font-semibold">
          <span data-gc="descoberta.cartao-de-tema.span--3" className="truncate">{tema.nome}</span>
          {tema.versao && <span data-gc="descoberta.cartao-de-tema.span--4" className="shrink-0 text-10 text-ink-faint">v{tema.versao}</span>}
        </h3>

        {tema.descricao && (
          <p data-gc="descoberta.cartao-de-tema.p" className="mt-1 line-clamp-3 text-xs text-ink-muted">{tema.descricao}</p>
        )}

        {tema.tags.length > 0 && (
          <div data-gc="descoberta.cartao-de-tema.div--3" className="mt-2 flex flex-wrap gap-1">
            {tema.tags.slice(0, 3).map((tag) => (
              <span data-gc="descoberta.cartao-de-tema.span--5" key={tag} className="rounded bg-surface-3 px-1.5 py-0.5 text-10 text-ink-faint">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div data-gc="descoberta.cartao-de-tema.div--4" className="mt-auto flex items-center gap-2 pt-4 text-xs text-ink-faint">
          <Avatar data-gc="descoberta.cartao-de-tema.avatar"
            id={tema.publicadoPor.id}
            name={tema.publicadoPor.displayName}
            url={tema.publicadoPor.avatarUrl}
            size={20}
          />
          <span data-gc="descoberta.cartao-de-tema.span--6" className="truncate">{tema.autor ?? tema.publicadoPor.displayName}</span>
        </div>

        <div data-gc="descoberta.cartao-de-tema.div--5" className="mt-3">
          <Button data-gc="descoberta.cartao-de-tema.button"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onImportar();
            }}
          >
            <Download data-gc="descoberta.cartao-de-tema.download" size={14} /> Importar
          </Button>
        </div>
      </div>
    </article>
  );
};
