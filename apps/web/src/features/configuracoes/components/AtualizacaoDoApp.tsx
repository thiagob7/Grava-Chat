import React from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useUpdate } from "~/features/app/hooks/use-atualizacao";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { useTranslation } from "~/traducao";

export const UpdateApp: React.FC = () => {
  const { state, bridge, downloading, ready, installing } = useUpdate();
  const { t } = useTranslation();

  if (!bridge) {
    return (
      <Section data-gc="configuracoes.atualizacao-do-app.section" id="atualizacao" title={t("comum.atualizacao.titulo")}>
        <p data-gc="configuracoes.atualizacao-do-app.p" className="text-sm text-ink-muted">
          {t("comum.atualizacao.semAuto")}
        </p>
      </Section>
    );
  }

  const hasNews = Boolean(state?.available);

  return (
    <Section data-gc="configuracoes.atualizacao-do-app.section--2"
      id="atualizacao"
      title={t("comum.atualizacao.titulo")}
      detail={state ? t("comum.atualizacao.versaoAtual", { versao: state.current }) : undefined}
    >
      <div data-gc="configuracoes.atualizacao-do-app.div" className="flex items-start gap-4">
        <div data-gc="configuracoes.atualizacao-do-app.div--2" className="min-w-0 flex-1">
          <p data-gc="configuracoes.atualizacao-do-app.p--2" className="text-sm font-medium">
            {installing
              ? t("comum.atualizacao.instalando", { versao: state?.available })
              : ready
                ? t("comum.atualizacao.prontaVersao", { versao: state?.available })
                : downloading
                  ? t("comum.atualizacao.baixandoVersao", { versao: state?.available })
                  : hasNews
                    ? t("comum.atualizacao.saiuVersao", { versao: state?.available })
                    : state?.phase === "procurando"
                      ? t("comum.atualizacao.procurando")
                      : t("comum.atualizacao.emDia")}
          </p>

          <p data-gc="configuracoes.atualizacao-do-app.p--3"
            className={cn(
              "mt-0.5 text-xs",
              state?.error ? "text-danger" : "text-ink-faint",
            )}
          >
            {state?.error
              ? state.error
              : installing
                ? t("comum.atualizacao.vaiFechar")
                : ready
                  ? t("comum.atualizacao.comoInstala")
                  : state?.phase === "erro"
                    ? t("comum.atualizacao.semServidor")
                    : t("comum.atualizacao.procuraSozinho")}
          </p>

          {downloading && (
            <div data-gc="configuracoes.atualizacao-do-app.div--3" className="mt-2 h-1 w-full overflow-hidden rounded-full bg-trilho">
              <div data-gc="configuracoes.atualizacao-do-app.div--4"
                className="h-full rounded-full bg-brand transition-all"
                style={{
                  width: `${Math.round((state?.progress ?? 0) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        {installing ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button" variant="surface" disabled>
            <Loader2 data-gc="configuracoes.atualizacao-do-app.loader2" size={16} className="animate-spin" /> {t("comum.atualizacao.instalandoCurto")}
          </Button>
        ) : ready ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button--2" onClick={() => void bridge.install()}>
            <RefreshCw data-gc="configuracoes.atualizacao-do-app.refresh-cw" size={16} />{" "}
            {state?.error ? t("comum.atualizacao.tentarDeNovo") : t("comum.atualizacao.instalarEReiniciar")}
          </Button>
        ) : downloading ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button--3" variant="surface" disabled>
            <Loader2 data-gc="configuracoes.atualizacao-do-app.loader2--2" size={16} className="animate-spin" /> {t("comum.atualizacao.baixandoCurto")}
          </Button>
        ) : hasNews ? (
          <Button data-gc="configuracoes.atualizacao-do-app.button--4" onClick={() => void bridge.download()}>
            <Download data-gc="configuracoes.atualizacao-do-app.download" size={16} /> {t("comum.atualizacao.baixar")}
          </Button>
        ) : (
          <Button data-gc="configuracoes.atualizacao-do-app.button--5"
            variant="surface"
            disabled={state?.phase === "procurando"}
            onClick={() => void bridge.lookup()}
          >
            <RefreshCw data-gc="configuracoes.atualizacao-do-app.refresh-cw--2" size={16} /> {t("comum.atualizacao.procurar")}
          </Button>
        )}
      </div>
    </Section>
  );
};
