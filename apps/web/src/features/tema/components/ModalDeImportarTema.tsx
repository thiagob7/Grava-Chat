import React, { useState } from "react";
import { toast } from "react-toastify";
import { ChevronDown, Code2, Palette, ShieldAlert, ShieldCheck, Weight } from "lucide-react";

import { themeWeight, weightReadable } from "@gravae/shared";

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
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const ImportThemeModal: React.FC = () => {
  const { t } = useTranslation();
  const themeId = useImportTheme((s) => s.themeId);
  const close = useImportTheme((s) => s.close);
  const doImport = useStudio((s) => s.doImport);
  const openSettings = useSettings((s) => s.open);
  const [showCss, setShowCss] = useState(false);

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

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) return;

    setShowCss(false);
    close();
  };

  const countTokens = theme ? Object.keys(theme.overrides).length : 0;
  const hasCss = Boolean(theme?.css.trim());
  const weight = theme ? themeWeight(theme.css, theme.actives) : 0;

  return (
    <Dialog data-gc="tema.modal-de-importar-tema.dialog.on-open-change" open={themeId !== null} onOpenChange={onOpenChange}>
      <DialogContent data-gc="tema.modal-de-importar-tema.dialog-content" className="max-w-xl">
        <DialogHeader data-gc="tema.modal-de-importar-tema.dialog-header">
          <DialogTitle data-gc="tema.modal-de-importar-tema.dialog-title">{t("configuracoes.tema.importar")}</DialogTitle>
          <DialogDescription data-gc="tema.modal-de-importar-tema.dialog-description">{t("configuracoes.tema.importarDetalhe")}</DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="tema.modal-de-importar-tema.dialog-body" className="space-y-4">
          {isLoading && (
            <>
              <Skeleton data-gc="tema.modal-de-importar-tema.skeleton" className="h-12 w-2/3 rounded-lg" />
              <Skeleton data-gc="tema.modal-de-importar-tema.skeleton--2" className="aspect-video w-full rounded-lg" />
            </>
          )}

          {isError && (
            <p data-gc="tema.modal-de-importar-tema.p" className="rounded-lg bg-surface-2 p-4 text-sm text-ink-muted">
              {t("configuracoes.tema.indisponivelLinha")}
            </p>
          )}

          {theme && (
            <>
              <div data-gc="tema.modal-de-importar-tema.div" className="flex items-start gap-3">
                <span data-gc="tema.modal-de-importar-tema.span" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Palette data-gc="tema.modal-de-importar-tema.palette" size={22} />
                </span>

                <div data-gc="tema.modal-de-importar-tema.div--2" className="min-w-0 flex-1">
                  <p data-gc="tema.modal-de-importar-tema.p--2" className="truncate text-base font-semibold leading-tight">{theme.name}</p>

                  {(theme.author || theme.version) && (
                    <p data-gc="tema.modal-de-importar-tema.p--3" className="mt-0.5 truncate text-xs text-ink-faint">
                      {[theme.author && t("configuracoes.tema.porAutor", { autor: theme.author }), theme.version && `v${theme.version}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  {theme.description && <p data-gc="tema.modal-de-importar-tema.p--4" className="mt-1.5 text-sm text-ink-muted">{theme.description}</p>}
                </div>
              </div>

              {theme.tags.length > 0 && (
                <div data-gc="tema.modal-de-importar-tema.div--3" className="flex flex-wrap gap-1.5">
                  {theme.tags.map((tag) => (
                    <span data-gc="tema.modal-de-importar-tema.span--2" key={tag} className="rounded-full bg-surface-3 px-2.5 py-0.5 text-xs text-ink-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <ThemePreview data-gc="tema.modal-de-importar-tema.theme-preview"
                themeId={theme.id}
                className="aspect-video w-full overflow-hidden rounded-lg border border-line shadow-lg"
              />

              <div data-gc="tema.modal-de-importar-tema.div--4" className="flex flex-wrap gap-2 text-xs text-ink-muted">
                {countTokens > 0 && (
                  <Fact data-gc="tema.modal-de-importar-tema.fact" icon={<Palette data-gc="tema.modal-de-importar-tema.palette--2" size={13} />}>
                    {countTokens === 1
                      ? t("configuracoes.tema.umaCorTrocada")
                      : t("configuracoes.tema.coresTrocadas", { quantas: countTokens })}
                  </Fact>
                )}
                <Fact data-gc="tema.modal-de-importar-tema.fact--2" icon={<Weight data-gc="tema.modal-de-importar-tema.weight" size={13} />}>{weightReadable(weight)}</Fact>
              </div>

              <ActivePreview data-gc="tema.modal-de-importar-tema.active-preview" actives={theme.actives} weight={weight} />

              {hasCss ? (
                <div data-gc="tema.modal-de-importar-tema.div--5" className="space-y-2">
                  <div data-gc="tema.modal-de-importar-tema.div--6" className="flex gap-3 rounded-lg border border-aviso/40 bg-aviso/10 px-3 py-2.5">
                    <ShieldAlert data-gc="tema.modal-de-importar-tema.shield-alert" size={16} className="mt-0.5 shrink-0 text-aviso" />
                    <p data-gc="tema.modal-de-importar-tema.p--5" className="text-xs leading-5 text-ink-muted">{t("configuracoes.tema.avisoDeCss")}</p>
                  </div>

                  <button data-gc="tema.modal-de-importar-tema.button"
                    type="button"
                    onClick={() => setShowCss((current) => !current)}
                    aria-expanded={showCss}
                    className="flex w-full items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-left text-sm text-ink-muted transition hover:border-ink-faint/40 hover:text-ink"
                  >
                    <Code2 data-gc="tema.modal-de-importar-tema.code2" size={15} className="shrink-0" />
                    <span data-gc="tema.modal-de-importar-tema.span--3" className="flex-1">{showCss ? t("configuracoes.tema.esconderCss") : t("configuracoes.tema.verCss")}</span>
                    <ChevronDown data-gc="tema.modal-de-importar-tema.chevron-down" size={15} className={cn("shrink-0 transition-transform", showCss && "rotate-180")} />
                  </button>

                  {showCss && (
                    <pre data-gc="tema.modal-de-importar-tema.pre" className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-line bg-surface-0 p-4 font-mono text-12 leading-relaxed text-ink">
                      {theme.css}
                    </pre>
                  )}
                </div>
              ) : (
                <div data-gc="tema.modal-de-importar-tema.div--7" className="flex gap-3 rounded-lg border border-online/30 bg-online/10 px-3 py-2.5">
                  <ShieldCheck data-gc="tema.modal-de-importar-tema.shield-check" size={16} className="mt-0.5 shrink-0 text-online" />
                  <p data-gc="tema.modal-de-importar-tema.p--6" className="text-xs leading-5 text-ink-muted">{t("configuracoes.tema.soCores")}</p>
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter data-gc="tema.modal-de-importar-tema.dialog-footer">
          <Button data-gc="tema.modal-de-importar-tema.button--2" variant="surface" onClick={() => onOpenChange(false)}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="tema.modal-de-importar-tema.button.apply" disabled={!theme} onClick={apply}>
            <Palette data-gc="tema.modal-de-importar-tema.palette--3" size={16} /> {t("configuracoes.tema.aplicar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Fact: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span data-gc="tema.modal-de-importar-tema.span--4" className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-1">
    {icon}
    {children}
  </span>
);
