import React from "react";
import { Palette } from "lucide-react";

import { PREVIEW_COLORS, themeWeight, weightReadable } from "@gravae/shared";

import { useTheme } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import { useImportTheme } from "~/features/tema/stores/importar-tema";
import { ThemePreview } from "~/features/tema/components/PreviaDoTema";
import { useTranslation } from "~/traducao";

export const ThemeCard: React.FC<{ themeId: string }> = ({ themeId }) => {
  const { t } = useTranslation();
  const { data: theme, isLoading, isError } = useTheme(themeId);
  const openImport = useImportTheme((s) => s.open);

  if (isLoading)
    return (
      <div data-gc="tema.cartao-de-tema.div" className="mt-1 h-[6.5rem] w-72 animate-pulse rounded-lg border border-line bg-surface-2" />
    );

  if (isError || !theme)
    return (
      <div data-gc="tema.cartao-de-tema.div--2" className="mt-1 w-72 rounded-lg border border-line bg-surface-2 p-3">
        <p data-gc="tema.cartao-de-tema.p" className="text-sm font-medium text-ink-muted">{t("configuracoes.tema.indisponivel")}</p>
        <p data-gc="tema.cartao-de-tema.p--2" className="mt-0.5 text-xs text-ink-faint">
          {t("configuracoes.tema.indisponivelDetalhe")}
        </p>
      </div>
    );

  const hasCss = theme.css.trim().length > 0;
  const countTokens = Object.keys(theme.overrides).length;

  const summary = [
    hasCss && "Você tem CSS!",
    countTokens > 0 && `${countTokens} ${countTokens === 1 ? "cor" : "cores"}`,
    theme.actives.length > 0 &&
      `${theme.actives.length} ${theme.actives.length === 1 ? "imagem" : "imagens"}`,
    theme.actives.length > 0 && weightReadable(themeWeight(theme.css, theme.actives)),
  ]
    .filter(Boolean)
    .join(" · ");

  const colors = PREVIEW_COLORS.map((token) => theme.overrides[token]).filter(Boolean);

  return (
    <article data-gc="tema.cartao-de-tema.article" className="mt-1 w-72 overflow-hidden rounded-lg border border-line bg-surface-2">
      <div data-gc="tema.cartao-de-tema.div--3" className="relative flex aspect-video shrink-0 overflow-hidden bg-surface-4">
        {colors.length ? (
          colors.map((color, i) => (
            <span data-gc="tema.cartao-de-tema.span" key={i} className="flex-1" style={{ backgroundColor: color }} />
          ))
        ) : (
          <span data-gc="tema.cartao-de-tema.span--2" className="flex-1" />
        )}

        <ThemePreview data-gc="tema.cartao-de-tema.theme-preview" themeId={theme.id} className="absolute inset-0 bg-transparent" />
      </div>

      <div data-gc="tema.cartao-de-tema.div--4" className="flex items-center gap-3 p-3">
        <span data-gc="tema.cartao-de-tema.span--3" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca">
          <Palette data-gc="tema.cartao-de-tema.palette" size={20} />
        </span>

        <div data-gc="tema.cartao-de-tema.div--5" className="min-w-0 flex-1">
          <p data-gc="tema.cartao-de-tema.p--3" className="truncate text-sm font-semibold">{theme.name}</p>
          <p data-gc="tema.cartao-de-tema.p--4" className="truncate text-xs text-ink-faint">{summary}</p>
        </div>
      </div>

      {(theme.description || theme.author || theme.version) && (
        <div data-gc="tema.cartao-de-tema.div--6" className="px-3 pb-2">
          {theme.description && (
            <p data-gc="tema.cartao-de-tema.p--5" className="line-clamp-2 text-xs text-ink-muted">{theme.description}</p>
          )}

          {(theme.author || theme.version) && (
            <p data-gc="tema.cartao-de-tema.p--6" className="mt-1 truncate text-xs text-ink-faint">
              {[theme.author && `por ${theme.author}`, theme.version && `v${theme.version}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      <div data-gc="tema.cartao-de-tema.div--7" className="p-3 pt-1">
        <Button data-gc="tema.cartao-de-tema.button"
          size="sm"
          className="w-full"
          onClick={() => openImport(theme.id)}
        >
          {t("configuracoes.tema.importar")}
        </Button>
      </div>
    </article>
  );
};
