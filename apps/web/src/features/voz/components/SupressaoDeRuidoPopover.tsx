import React, { useState } from "react";
import { AudioLines, Loader2, SlidersHorizontal } from "lucide-react";

import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Switch } from "~/components/ui/switch";
import { useVoiceMeter } from "~/features/voz/hooks/use-voice-meter";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface Props {
  children: React.ReactNode;
  ligada: boolean;
  disponivel: boolean;
  ocupada: boolean;
  onAlternar: () => void;
  onAbrirAjustes: () => void;
}

export const SupressaoDeRuidoPopover: React.FC<Props> = ({
  children,
  ligada,
  disponivel,
  ocupada,
  onAlternar,
  onAbrirAjustes,
}) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);

  return (
    <Popover data-gc="voz.supressao-de-ruido-popover.popover.set-aberto" open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger data-gc="voz.supressao-de-ruido-popover.popover-trigger" asChild>{children}</PopoverTrigger>

      <PopoverContent data-gc="voz.supressao-de-ruido-popover.popover-content" side="top" align="end" className="w-80 p-4">
        <PopoverArrow data-gc="voz.supressao-de-ruido-popover.popover-arrow" />

        <div data-gc="voz.supressao-de-ruido-popover.div" className="flex items-start justify-between gap-3">
          <h3 data-gc="voz.supressao-de-ruido-popover.h3" className="flex items-center gap-2 text-sm font-semibold">
            <AudioLines data-gc="voz.supressao-de-ruido-popover.audio-lines" size={16} className={ligada && disponivel ? "text-online" : undefined} />
            {t("chamada.ruido.titulo")}
          </h3>

          <Switch data-gc="voz.supressao-de-ruido-popover.switch.on-alternar"
            checked={ligada && disponivel}
            disabled={!disponivel || ocupada}
            onCheckedChange={onAlternar}
          />
        </div>

        <p data-gc="voz.supressao-de-ruido-popover.p" className="mt-2 text-xs leading-relaxed text-ink-muted">
          {disponivel
            ? t("chamada.ruido.explicacao")
            : t("chamada.ruido.semSuporte")}
        </p>

        {ocupada && (
          <p data-gc="voz.supressao-de-ruido-popover.p--2" className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
            <Loader2 data-gc="voz.supressao-de-ruido-popover.loader2" size={12} className="animate-spin" /> {t("chamada.ruido.aplicando")}
          </p>
        )}

        <TesteDoMicrofone data-gc="voz.supressao-de-ruido-popover.teste-do-microfone" aberto={aberto} />

        <div data-gc="voz.supressao-de-ruido-popover.div--2" className="mt-4 flex items-center justify-between border-t border-divisor pt-3">
          <span data-gc="voz.supressao-de-ruido-popover.span" className="text-xs text-ink-faint">
            {t("chamada.ruido.feitoCom")} <span data-gc="voz.supressao-de-ruido-popover.span--2" className="text-ink-muted">RNNoise</span>{t("chamada.ruido.aquiNoAparelho")}
          </span>

          <button data-gc="voz.supressao-de-ruido-popover.button"
            onClick={() => {
              setAberto(false);
              onAbrirAjustes();
            }}
            className="flex shrink-0 items-center gap-1.5 rounded p-1.5 text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink"
          >
            <SlidersHorizontal data-gc="voz.supressao-de-ruido-popover.sliders-horizontal" size={13} /> {t("chamada.ruido.ajustes")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const TesteDoMicrofone: React.FC<{ aberto: boolean }> = ({ aberto }) => {
  const { t } = useTranslation();
  const { nivel, aberto: passando, erro } = useVoiceMeter(aberto);

  if (erro)
    return <p data-gc="voz.supressao-de-ruido-popover.p--3" className="mt-3 text-xs text-danger">Não consegui ouvir o microfone: {erro}</p>;

  return (
    <div data-gc="voz.supressao-de-ruido-popover.div--3" className="mt-3">
      <p data-gc="voz.supressao-de-ruido-popover.p--4" className="mb-1.5 text-xs font-medium text-ink-muted">{t("chamada.ruido.faleParaTestar")}</p>

      <div data-gc="voz.supressao-de-ruido-popover.div--4" className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-0">
        <div data-gc="voz.supressao-de-ruido-popover.div--5"
          className={cn(
            "h-full rounded-full transition-[width] duration-75",
            passando ? "bg-online" : "bg-surface-4",
          )}
          style={{ width: `${Math.min(100, nivel * 100)}%` }}
        />
      </div>

      <p data-gc="voz.supressao-de-ruido-popover.p--5" className="mt-1.5 text-11 text-ink-faint">
        {t(passando ? "chamada.ruido.teOuvindo" : "chamada.ruido.verdeQuandoPassa")}
      </p>
    </div>
  );
};
