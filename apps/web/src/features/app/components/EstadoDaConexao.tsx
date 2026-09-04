import React, { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Splash } from "~/features/app/components/Splash";
import { Button } from "~/components/ui/button";
import { ehDesktop } from "~/lib/desktop";
import { useConexaoStore } from "~/features/app/stores/conexao-store";
import { cn } from "~/lib/utils";

const SILENCIO_MS = 1_500;

const ALIVIO_MS = 2_500;

const TENTATIVAS_ATE_OFERECER_RECARGA = 5;

type Fase = "oculto" | "caiu" | "voltou";

export const EstadoDaConexao: React.FC = () => {
  const { conectado, caiuEm, tentativas, jaConectou } = useConexaoStore();
  const [fase, setFase] = useState<Fase>("oculto");

  useEffect(() => {
    if (!jaConectou) return;

    if (conectado) {
      setFase((atual) => (atual === "caiu" ? "voltou" : "oculto"));
      return;
    }

    if (caiuEm === null) return;

    setFase((atual) => (atual === "voltou" ? "oculto" : atual));

    const relogio = setTimeout(
      () => setFase("caiu"),
      Math.max(0, SILENCIO_MS - (Date.now() - caiuEm)),
    );

    return () => clearTimeout(relogio);
  }, [conectado, caiuEm, jaConectou]);

  useEffect(() => {
    if (fase !== "voltou") return;

    const relogio = setTimeout(() => setFase("oculto"), ALIVIO_MS);
    return () => clearTimeout(relogio);
  }, [fase]);

  if (fase === "oculto") return null;

  if (fase === "voltou")
    return (
      <div
        role="status"
        className={cn(
          "pointer-events-none fixed inset-x-0 z-[110] flex justify-center",
          ehDesktop() ? "top-10" : "top-3",
        )}
      >
        <span className="flex items-center gap-2 rounded-full bg-online px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          <Check size={14} /> Conectado de novo
        </span>
      </div>
    );

  return (
    <div
      role="status"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[110] bg-surface-2",
        ehDesktop() ? "top-8" : "top-0",
      )}
    >
      <Splash
        legenda={
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={14} className="animate-spin" />
              Reconectando
              {tentativas > 1 && ` · tentativa ${tentativas}`}
            </p>

            <p className="max-w-xs text-xs text-ink-faint">
              A conversa está a salvo no servidor. Isto volta sozinho assim que
              a conexão voltar.
            </p>

            {tentativas >= TENTATIVAS_ATE_OFERECER_RECARGA && (
              <Button variant="surface" size="sm" onClick={() => window.location.reload()}>
                Recarregar
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
};
