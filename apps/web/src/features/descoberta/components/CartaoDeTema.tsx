import React from "react";
import { Download } from "lucide-react";
import { PREVIEW_COLORS, weightReadable, type GalleryTheme } from "@gravae/shared";

import { Avatar } from "~/features/perfil/components/Avatar";
import { ThemePreview } from "~/features/tema/components/PreviaDoTema";
import { Button } from "~/components/ui/button";
import { useTranslation } from "~/traducao";

export const ThemeGalleryCard: React.FC<{
  theme: GalleryTheme;
  onImport: () => void;
}> = ({ theme, onImport }) => {
  const { t } = useTranslation();
  const colors = PREVIEW_COLORS.map((token) => theme.overrides[token]).filter(Boolean);

  return (
    <article data-gc="descoberta.cartao-de-tema.article.on-import"
      className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-line bg-surface-2 transition hover:border-ink-faint/30"
      onClick={onImport}
    >
      <div data-gc="descoberta.cartao-de-tema.div" className="relative flex aspect-video shrink-0 overflow-hidden bg-surface-4">
        {/*
          A faixa de cores fica embaixo como rascunho: aparece na hora e some
          atrás da prévia quando ela carrega, então o cartão nunca pisca vazio.
        */}
        {colors.length ? (
          colors.map((color, i) => (
            <span data-gc="descoberta.cartao-de-tema.span" key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))
        ) : (
          <span data-gc="descoberta.cartao-de-tema.span--2" className="flex-1" />
        )}

        <ThemePreview data-gc="descoberta.cartao-de-tema.theme-preview" themeId={theme.id} className="absolute inset-0 bg-transparent" />

        {theme.actives.length > 0 && (
          <span data-gc="descoberta.cartao-de-tema.span--3" className="absolute bottom-1.5 right-1.5 rounded bg-surface-0/85 px-1.5 py-0.5 text-10 font-medium text-ink backdrop-blur-sm">
            {theme.actives.length > 1 ? `${theme.actives.length} imagens · ` : ""}
            {weightReadable(theme.weightBytes)}
          </span>
        )}
      </div>

      <div data-gc="descoberta.cartao-de-tema.div--2" className="flex min-h-0 flex-1 flex-col p-4">
        <h3 data-gc="descoberta.cartao-de-tema.h3" className="flex items-baseline gap-1.5 text-sm font-semibold">
          <span data-gc="descoberta.cartao-de-tema.span--4" className="truncate">{theme.name}</span>
          {theme.version && <span data-gc="descoberta.cartao-de-tema.span--5" className="shrink-0 text-10 text-ink-faint">v{theme.version}</span>}
        </h3>

        {theme.description && (
          <p data-gc="descoberta.cartao-de-tema.p" className="mt-1 line-clamp-3 text-xs text-ink-muted">{theme.description}</p>
        )}

        {theme.tags.length > 0 && (
          <div data-gc="descoberta.cartao-de-tema.div--3" className="mt-2 flex flex-wrap gap-1">
            {theme.tags.slice(0, 3).map((tag) => (
              <span data-gc="descoberta.cartao-de-tema.span--6" key={tag} className="rounded bg-surface-3 px-1.5 py-0.5 text-10 text-ink-faint">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div data-gc="descoberta.cartao-de-tema.div--4" className="mt-auto flex items-center gap-2 pt-4 text-xs text-ink-faint">
          <Avatar data-gc="descoberta.cartao-de-tema.avatar"
            id={theme.publishedBy.id}
            name={theme.publishedBy.displayName}
            url={theme.publishedBy.avatarUrl}
            size={20}
          />
          <span data-gc="descoberta.cartao-de-tema.span--7" className="truncate">{theme.author ?? theme.publishedBy.displayName}</span>
        </div>

        <div data-gc="descoberta.cartao-de-tema.div--5" className="mt-3">
          <Button data-gc="descoberta.cartao-de-tema.button"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onImport();
            }}
          >
            <Download data-gc="descoberta.cartao-de-tema.download" size={14} /> {t("configuracoes.tema.importarCurto")}
          </Button>
        </div>
      </div>
    </article>
  );
};
