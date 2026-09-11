import React from "react";
import { toast } from "react-toastify";

import { themeWeight } from "@gravae/shared";

import { useTheme } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { useStudio } from "~/features/configuracoes/stores/estudio";
import { ActivePreview } from "~/features/tema/components/PreviaDosAtivos";
import { ThemePreview } from "~/features/tema/components/PreviaDoTema";
import { useImportTheme } from "~/features/tema/stores/importar-tema";
import { useTranslation } from "~/traducao";

export const ImportThemeModal: React.FC = () => {
  const { t } = useTranslation();
  const themeId = useImportTheme((s) => s.themeId);
  const close = useImportTheme((s) => s.close);
  const doImport = useStudio((s) => s.doImport);
  const openSettings = useSettings((s) => s.open);

  const { data: theme, isLoading, isError } = useTheme(themeId ?? undefined);

  const apply = () => {
    if (!theme) return;

    doImport({
      css: theme.css,
      overrides: theme.overrides,
      actives: theme.actives,
      name: theme.name,
      originId: theme.id,
    });
    openSettings("appearance", "tema");
    toast.success(`${theme.name} aplicado. Está no estúdio de temas.`);
    close();
  };

  const countTokens = theme ? Object.keys(theme.overrides).length : 0;

  return (
    <Dialog data-gc="tema.modal-de-importar-tema.dialog" open={themeId !== null} onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent data-gc="tema.modal-de-importar-tema.dialog-content" className="max-w-xl">
        <DialogHeader data-gc="tema.modal-de-importar-tema.dialog-header">
          <DialogTitle data-gc="tema.modal-de-importar-tema.dialog-title">{t("configuracoes.tema.importar")}</DialogTitle>
          <DialogDescription data-gc="tema.modal-de-importar-tema.dialog-description">
            {t("configuracoes.tema.importarDetalhe")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="tema.modal-de-importar-tema.dialog-body" className="space-y-3">
          {isLoading && <Skeleton data-gc="tema.modal-de-importar-tema.skeleton" className="h-64 w-full rounded-lg" />}

          {isError && (
            <p data-gc="tema.modal-de-importar-tema.p" className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
              {t("configuracoes.tema.indisponivelLinha")}
            </p>
          )}

          {theme && (
            <>
              <p data-gc="tema.modal-de-importar-tema.p--2" className="text-sm">
                <span data-gc="tema.modal-de-importar-tema.span" className="font-semibold">{theme.name}</span>
                {(theme.author || theme.version) && (
                  <span data-gc="tema.modal-de-importar-tema.span--2" className="text-ink-faint">
                    {" · "}
                    {[theme.author && t("configuracoes.tema.porAutor", { autor: theme.author }), theme.version && `v${theme.version}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </p>

              {countTokens > 0 && (
                <p data-gc="tema.modal-de-importar-tema.p--3" className="text-xs text-ink-faint">
                  {countTokens === 1
                    ? t("configuracoes.tema.umaCorTrocada")
                    : t("configuracoes.tema.coresTrocadas", { quantas: countTokens })}
                </p>
              )}

              <ThemePreview data-gc="tema.modal-de-importar-tema.theme-preview"
                themeId={theme.id}
                className="aspect-video w-full overflow-hidden rounded-lg border border-line"
              />

              <ActivePreview data-gc="tema.modal-de-importar-tema.active-preview"
                actives={theme.actives}
                weight={themeWeight(theme.css, theme.actives)}
              />

              {theme.css.trim() ? (
                <>
                  <pre data-gc="tema.modal-de-importar-tema.pre" className="max-h-72 overflow-auto rounded-lg border border-line bg-surface-0 p-4 font-mono text-13 leading-relaxed text-ink">
                    {theme.css}
                  </pre>

                  <p data-gc="tema.modal-de-importar-tema.p--4" className="text-xs text-aviso">
                    {t("configuracoes.tema.avisoDeCss")}
                  </p>
                </>
              ) : (
                <p data-gc="tema.modal-de-importar-tema.p--5" className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
                  {t("configuracoes.tema.soCores")}
                </p>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter data-gc="tema.modal-de-importar-tema.dialog-footer">
          <Button data-gc="tema.modal-de-importar-tema.button.close" variant="surface" onClick={close}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="tema.modal-de-importar-tema.button.apply" disabled={!theme} onClick={apply}>
            {t("configuracoes.tema.aplicar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
