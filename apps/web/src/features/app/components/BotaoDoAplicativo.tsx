import React from "react";
import { ArrowClockwise, DownloadSimple } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { isDesktop } from "~/lib/desktop";
import { useUpdate } from "~/features/app/hooks/use-atualizacao";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const AppButton: React.FC = () => {
  const openSettings = useSettings((s) => s.open);
  const { t } = useTranslation();
  const { state, bridge, hasNews, downloading, ready, installing } = useUpdate();

  if (!isDesktop()) {
    return (
      <Tooltip data-gc="app.botao-do-aplicativo.tooltip" label={t("comum.atualizacao.baixarApp")}>
        <button data-gc="app.botao-do-aplicativo.button"
          onClick={() => openSettings("app")}
          aria-label={t("comum.atualizacao.baixarApp")}
          className="text-online transition hover:brightness-125"
        >
          <DownloadSimple data-gc="app.botao-do-aplicativo.download-simple" size={20} weight="bold" />
        </button>
      </Tooltip>
    );
  }

  if (!bridge || !hasNews) return null;

  const onClick = () => void (ready ? bridge.install() : bridge.download());

  return (
    <Tooltip data-gc="app.botao-do-aplicativo.tooltip--2"
      label={
        installing
          ? t("comum.atualizacao.instalando", { versao: state?.available })
          : state?.error && ready
            ? t("comum.atualizacao.erroTenteDeNovo", { erro: state.error })
            : ready
              ? t("comum.atualizacao.instalarVersaoEReiniciar", { versao: state?.available })
              : downloading
                ? t("comum.atualizacao.baixandoVersao", { versao: state?.available })
                : t("comum.atualizacao.saiuVersaoClique", { versao: state?.available })
      }
    >
      <button data-gc="app.botao-do-aplicativo.button.on-click"
        onClick={onClick}
        disabled={downloading || installing}
        aria-label={t("comum.atualizacao.ariaBotao")}
        className={cn(
          "relative transition hover:brightness-125 disabled:cursor-default",
          state?.error && ready ? "text-danger" : "text-online",
          downloading && "animate-pulse",
        )}
      >
        {ready || installing ? (
          <ArrowClockwise data-gc="app.botao-do-aplicativo.arrow-clockwise" size={20} weight="bold" className={cn(installing && "animate-spin")} />
        ) : (
          <DownloadSimple data-gc="app.botao-do-aplicativo.download-simple--2" size={20} weight="bold" />
        )}

        {ready && (
          <span data-gc="app.botao-do-aplicativo.span" className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-online" />
        )}
      </button>
    </Tooltip>
  );
};
