import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Splash } from "~/features/app/components/Splash";
import { Button } from "~/components/ui/button";
import { isDesktop } from "~/lib/desktop";
import { useConnectionStore } from "~/features/app/stores/conexao-store";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

const SILENCE_MS = 1_500;

const RELIEF_MS = 2_500;

const ATTEMPTS_UNTIL_OFFER_RELOAD = 5;

type Phase = "oculto" | "caiu" | "voltou";

export const ConnectionState: React.FC = () => {
  const { t } = useTranslation();
  const { connected, droppedAt, attempts, alreadyConnected } = useConnectionStore();
  const [phase, setPhase] = useState<Phase>("oculto");

  useEffect(() => {
    if (!alreadyConnected) return;

    if (connected) {
      setPhase((current) => (current === "caiu" ? "voltou" : "oculto"));
      return;
    }

    if (droppedAt === null) return;

    setPhase((current) => (current === "voltou" ? "oculto" : current));

    const clock = setTimeout(
      () => setPhase("caiu"),
      Math.max(0, SILENCE_MS - (Date.now() - droppedAt)),
    );

    return () => clearTimeout(clock);
  }, [connected, droppedAt, alreadyConnected]);

  useEffect(() => {
    if (phase !== "voltou") return;

    const clock = setTimeout(() => setPhase("oculto"), RELIEF_MS);
    return () => clearTimeout(clock);
  }, [phase]);

  if (phase === "oculto") return null;

  if (phase === "voltou")
    return (
      <div data-gc="app.estado-da-conexao.div"
        role="status"
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[110] flex justify-center",
          isDesktop() ? "top-10" : "top-3",
        )}
      >
        <span data-gc="app.estado-da-conexao.span" className="flex items-center gap-2 rounded-full bg-online px-3 py-1.5 text-xs font-medium text-sobre-marca shadow-lg">
          <Check data-gc="app.estado-da-conexao.check" size={14} /> {t("comum.conexao.voltou")}
        </span>
      </div>
    );

  return (
    <div data-gc="app.estado-da-conexao.div--2"
      role="status"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[110] bg-surface-2",
        isDesktop() ? "top-8" : "top-0",
      )}
    >
      <Splash data-gc="app.estado-da-conexao.splash"
        legenda={
          <div data-gc="app.estado-da-conexao.div--3" className="flex flex-col items-center gap-3 text-center">
            <p data-gc="app.estado-da-conexao.p" className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 data-gc="app.estado-da-conexao.loader2" size={14} className="animate-spin" />
              {t("comum.conexao.reconectando")}
              {attempts > 1 && t("comum.conexao.tentativaSufixo", { numero: attempts })}
            </p>

            <p data-gc="app.estado-da-conexao.p--2" className="max-w-xs text-xs text-ink-faint">
              {t("comum.conexao.aSalvo")}
            </p>

            {attempts >= ATTEMPTS_UNTIL_OFFER_RELOAD && (
              <Button data-gc="app.estado-da-conexao.button" variant="surface" size="sm" onClick={() => window.location.reload()}>
                {t("comum.erro.recarregar")}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
};
