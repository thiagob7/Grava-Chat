import React from "react";
import { Monitor, MonitorX } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const CartaoDaTransmissao: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();
  const fonte = useVoiceStore((s) => s.fonteDaTela);
  const transmitindo = useVoiceStore((s) => s.screenEnabled);
  const encerrar = useVoiceStore((s) => s.toggleScreen);

  if (!transmitindo || !fonte) return null;

  return (
    <div
      className={cn(
        "relative z-30 flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5",
        "shadow-lg shadow-black/30 ring-1 ring-white/[0.04]",
        className,
      )}
    >
      <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded bg-surface-4">
        {fonte.icone ? (
          <img src={fonte.icone} alt="" className="size-full object-contain" />
        ) : (
          <Monitor size={15} className="text-ink-muted" />
        )}

        <span className="absolute -bottom-px -right-px flex size-3.5 items-center justify-center rounded-sm bg-surface-3">
          <Videocam />
        </span>
      </span>

      <span className="min-w-0 flex-1 truncate text-xs font-semibold" title={fonte.nome}>
        {fonte.nome}
      </span>

      <Tooltip label={t("chamada.tela.pararDeCompartilhar")}>
        <button
          onClick={() => void encerrar()}
          aria-label={t("chamada.tela.pararDeCompartilhar")}
          className="shrink-0 rounded p-1 text-ink-muted transition hover:bg-surface-4 hover:text-danger"
        >
          <MonitorX size={14} />
        </button>
      </Tooltip>
    </div>
  );
};

const Videocam: React.FC = () => (
  <svg viewBox="0 0 16 16" className="size-2.5 fill-ink" aria-hidden>
    <path d="M1.5 4h7A1.5 1.5 0 0 1 10 5.5v5A1.5 1.5 0 0 1 8.5 12h-7A1.5 1.5 0 0 1 0 10.5v-5A1.5 1.5 0 0 1 1.5 4Zm10.2 2.1 2.6-1.5a.5.5 0 0 1 .7.44v5.92a.5.5 0 0 1-.7.44l-2.6-1.5a.5.5 0 0 1-.25-.44V6.54a.5.5 0 0 1 .25-.44Z" />
  </svg>
);
