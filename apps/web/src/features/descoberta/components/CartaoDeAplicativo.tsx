import React from "react";
import { SlashSquare } from "lucide-react";
import type { AppDiscovered } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { coverGenerated } from "~/lib/capa-gerada";
import { initials } from "~/lib/format";
import { useTranslation } from "~/traducao";

export const AppCard: React.FC<{
  app: AppDiscovered;
  onOpen: () => void;
}> = ({ app, onOpen }) => {
  const { t } = useTranslation();

  const category = app.categories[0];

  return (
    <article data-gc="descoberta.cartao-de-aplicativo.article.on-open"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface-2 outline-none transition hover:border-ink-faint/40 focus-visible:ring-2 focus-visible:ring-foco-anel"
    >
      <div data-gc="descoberta.cartao-de-aplicativo.div" className="relative shrink-0">
        <div data-gc="descoberta.cartao-de-aplicativo.div--2" className="h-24 overflow-hidden bg-surface-3">
          {app.coverUrl ? (
            <img data-gc="descoberta.cartao-de-aplicativo.img"
              src={app.coverUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span data-gc="descoberta.cartao-de-aplicativo.span"
              aria-hidden
              className="flex size-full items-center justify-end overflow-hidden"
              style={coverGenerated(app.id)}
            >
              <span data-gc="descoberta.cartao-de-aplicativo.span--2" className="-mr-1 select-none text-5xl font-black leading-none tracking-tighter text-sobre-marca opacity-15">
                {initials(app.name)}
              </span>
            </span>
          )}
        </div>

        <span data-gc="descoberta.cartao-de-aplicativo.span--3" className="absolute -bottom-5 left-4 rounded-full border-4 border-surface-2 bg-surface-2">
          <Avatar data-gc="descoberta.cartao-de-aplicativo.avatar"
            id={app.id}
            name={app.name}
            url={app.avatarUrl}
            size={44}
          />
        </span>
      </div>

      <div data-gc="descoberta.cartao-de-aplicativo.div--3" className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-8">
        <h3 data-gc="descoberta.cartao-de-aplicativo.h3" className="truncate text-sm font-semibold">
          {app.name}
        </h3>

        <p data-gc="descoberta.cartao-de-aplicativo.p" className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-muted">
          {app.description ?? t("servidor.descoberta.semDescricao")}
        </p>
      </div>

      <div data-gc="descoberta.cartao-de-aplicativo.div--4" className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2.5 text-xs text-ink-faint">
        {category && (
          <span data-gc="descoberta.cartao-de-aplicativo.span--4" className="flex items-center gap-1.5">
            <span data-gc="descoberta.cartao-de-aplicativo.span--5" className="size-1.5 rounded-full bg-brand" />
            {t(`servidor.descoberta.categoria.${category}`)}
          </span>
        )}

        <span data-gc="descoberta.cartao-de-aplicativo.span--6" className="flex items-center gap-1.5">
          <SlashSquare data-gc="descoberta.cartao-de-aplicativo.slash-square" size={12} className="shrink-0" />
          {t("servidor.descoberta.quantosComandos", { quantos: app.commands })}
        </span>
      </div>
    </article>
  );
};
