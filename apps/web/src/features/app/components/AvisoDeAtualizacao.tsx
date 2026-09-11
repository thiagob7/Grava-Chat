import React from "react";
import { CircleArrowUp, Download, Loader2, PackageCheck, RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "~/components/ui/button";
import { useUpdate } from "~/features/app/hooks/use-atualizacao";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const UpdateNotice: React.FC = () => {
  const { state, bridge, hasNews, downloading, ready, installing } = useUpdate();
  const { t } = useTranslation();

  if (!state || !hasNews) return null;

  return (
    <div data-gc="app.aviso-de-atualizacao.div"
      className={cn("pointer-events-none fixed inset-x-0 z-50 flex justify-center", "top-10")}
    >
      <div data-gc="app.aviso-de-atualizacao.div--2" className="regiao-sem-arrasto pointer-events-auto flex items-center gap-3 rounded-full bg-surface-0 py-1.5 pl-4 pr-1.5 text-xs shadow-lg ring-1 ring-line">
        <span data-gc="app.aviso-de-atualizacao.span" className="flex max-w-sm items-center gap-2">
          {state.error ? (
            <TriangleAlert data-gc="app.aviso-de-atualizacao.triangle-alert" size={14} className="shrink-0 text-danger" />
          ) : ready || installing ? (
            <PackageCheck data-gc="app.aviso-de-atualizacao.package-check" size={14} className="shrink-0 text-online" />
          ) : (
            <CircleArrowUp data-gc="app.aviso-de-atualizacao.circle-arrow-up" size={14} className="shrink-0 text-brand" />
          )}
          {state.error ? (
            <span data-gc="app.aviso-de-atualizacao.span--2" className="text-danger">{state.error}</span>
          ) : installing ? (
            <>{t("comum.atualizacao.instalando", { versao: state.available })}</>
          ) : ready ? (
            <>{t("comum.atualizacao.prontaVersao", { versao: state.available })}</>
          ) : downloading ? (
            <>{t("comum.atualizacao.baixandoComProgresso", { versao: state.available, porcento: Math.round(state.progress * 100) })}</>
          ) : (
            <>{t("comum.atualizacao.saiuVersao", { versao: state.available })}</>
          )}
        </span>

        {downloading ? (
          <span data-gc="app.aviso-de-atualizacao.span--3" className="h-1 w-24 overflow-hidden rounded-full bg-surface-3">
            <span data-gc="app.aviso-de-atualizacao.span--4"
              className="block h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.round(state.progress * 100)}%` }}
            />
          </span>
        ) : installing ? (
          <Button data-gc="app.aviso-de-atualizacao.button" size="sm" disabled>
            <Loader2 data-gc="app.aviso-de-atualizacao.loader2" size={13} className="animate-spin" /> {t("comum.atualizacao.instalandoReticencias")}
          </Button>
        ) : ready ? (
          <Button data-gc="app.aviso-de-atualizacao.button--2" size="sm" onClick={() => void bridge?.install()}>
            <RotateCw data-gc="app.aviso-de-atualizacao.rotate-cw" size={13} /> {state.error ? t("comum.atualizacao.tentarDeNovo") : t("comum.atualizacao.reiniciarAgora")}
          </Button>
        ) : (
          <Button data-gc="app.aviso-de-atualizacao.button--3" variant="surface" size="sm" onClick={() => void bridge?.download()}>
            <Download data-gc="app.aviso-de-atualizacao.download" size={13} /> {t("comum.atualizacao.baixar")}
          </Button>
        )}
      </div>
    </div>
  );
};
