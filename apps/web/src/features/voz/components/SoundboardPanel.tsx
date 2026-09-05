import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { LIMITS } from "@gravae/shared";
import { Music2, Search, Volume2, VolumeX } from "lucide-react";

import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { playSound } from "~/@core/lib/websocket/emit-voice";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import { Tooltip } from "~/components/ui/tooltip";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { cn } from "~/lib/utils";

interface SoundboardPanelProps {
  guildId: string | undefined;
  podeUsar: boolean;
}

export const SoundboardPanel: React.FC<SoundboardPanelProps> = ({ guildId, podeUsar }) => {
  const { data } = useFindExpressions(guildId);
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);

  const surdo = useVoiceStore((s) => s.deafened);
  const somDoPainel = useVoicePrefs((s) => s.somDoPainel);
  const volumeDoPainel = useVoicePrefs((s) => s.volumeDoPainel);
  const definir = useVoicePrefs((s) => s.definir);

  const [volumeAberto, setVolumeAberto] = useState(false);

  const saindo = useRef<ReturnType<typeof setTimeout>>(undefined);

  const mostrarVolume = () => {
    clearTimeout(saindo.current);
    setVolumeAberto(true);
  };

  const esconderVolume = () => {
    clearTimeout(saindo.current);
    saindo.current = setTimeout(() => setVolumeAberto(false), 220);
  };

  const [esperando, setEsperando] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(relogio.current);
      clearTimeout(saindo.current);
    },
    [],
  );

  const tocar = (id: string) => {
    if (esperando) return;

    setEsperando(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setEsperando(false), LIMITS.somEsperaMs);

    void playSound(id).catch((e: Error) => toast.error(e.message));
  };

  const sons = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return data.sounds;

    return data.sounds.filter((som) => som.name.toLowerCase().includes(termo));
  }, [data.sounds, busca]);

  const porcento = Math.round(volumeDoPainel * 100);

  useEffect(() => {
    if (surdo) setAberto(false);
  }, [surdo]);

  return (
    <Popover data-gc="voz.soundboard-panel.popover.set-aberto" open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger data-gc="voz.soundboard-panel.popover-trigger" asChild>
        <button data-gc="voz.soundboard-panel.button"
          aria-label="Efeitos sonoros"
          aria-disabled={surdo}
          onClick={(e) => surdo && e.preventDefault()}
          className={cn(
            "flex items-center justify-center rounded-lg bg-hover py-2 text-ink-muted transition",
            surdo ? "cursor-not-allowed opacity-40" : "hover:bg-surface-4 hover:text-ink",
          )}
        >
          <Tooltip data-gc="voz.soundboard-panel.tooltip"
            label={surdo ? "Ative o áudio pra usar os efeitos sonoros" : "Abrir efeitos sonoros"}
          >
            <Music2 data-gc="voz.soundboard-panel.music2" size={18} />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="voz.soundboard-panel.popover-content" side="top" align="center" collisionPadding={12} className="w-[21rem] p-0">
        <div data-gc="voz.soundboard-panel.div" className="flex items-center gap-2 border-b border-divisor p-3">
          <div data-gc="voz.soundboard-panel.div--2" className="relative flex-1">
            <Search data-gc="voz.soundboard-panel.search"
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input data-gc="voz.soundboard-panel.input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Encontre o som perfeito"
              className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
            />
          </div>

          <div data-gc="voz.soundboard-panel.div.mostrar-volume"
            className="shrink-0"
            onMouseEnter={mostrarVolume}
            onMouseLeave={esconderVolume}
          >
            <Popover data-gc="voz.soundboard-panel.popover.set-volume-aberto" open={volumeAberto} onOpenChange={setVolumeAberto}>
              <PopoverAnchor data-gc="voz.soundboard-panel.popover-anchor" asChild>
                <button data-gc="voz.soundboard-panel.button--2"
                  type="button"
                  aria-pressed={!somDoPainel}
                  aria-label={somDoPainel ? "Desativar os sons" : "Ativar os sons"}
                  onClick={() => definir({ somDoPainel: !somDoPainel })}
                  className={cn(
                    "p-1 transition",
                    somDoPainel ? "text-ink-muted hover:text-ink" : "text-danger hover:text-danger/80",
                  )}
                >
                  {somDoPainel ? <Volume2 data-gc="voz.soundboard-panel.volume2" size={20} /> : <VolumeX data-gc="voz.soundboard-panel.volume-x" size={20} />}
                </button>
              </PopoverAnchor>

              <PopoverContent data-gc="voz.soundboard-panel.popover-content.mostrar-volume"
                side="right"
                align="center"
                sideOffset={6}
                onMouseEnter={mostrarVolume}
                onMouseLeave={esconderVolume}
                portal={false}
                collisionPadding={12}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="w-60 p-3"
              >
                <PopoverArrow data-gc="voz.soundboard-panel.popover-arrow" />

                <div data-gc="voz.soundboard-panel.div--3" className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span data-gc="voz.soundboard-panel.span" className="font-medium text-ink-muted">Volume dos efeitos sonoros</span>
                  <span data-gc="voz.soundboard-panel.span--2" className="shrink-0 tabular-nums text-ink-faint">
                    {somDoPainel ? `${porcento}%` : "mudo"}
                  </span>
                </div>

                <Slider data-gc="voz.soundboard-panel.slider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volumeDoPainel}
                  preenchido={somDoPainel ? volumeDoPainel : 0}
                  disabled={!somDoPainel}
                  aria-label="Volume dos efeitos sonoros"
                  onChange={(e) => definir({ volumeDoPainel: Number(e.target.value) })}
                  className={somDoPainel ? undefined : "opacity-50"}
                />

                <p data-gc="voz.soundboard-panel.p" className="mt-2.5 text-11 leading-snug text-ink-faint">
                  {somDoPainel
                    ? "Vale só pra você. Clique no alto-falante pra desativar os sons."
                    : "Os sons estão desativados. Clique no alto-falante pra ouvir de novo."}
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div data-gc="voz.soundboard-panel.div--4" className="max-h-72 overflow-y-auto p-3">
          <h3 data-gc="voz.soundboard-panel.h3" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Sons do servidor
          </h3>

          {!data.sounds.length && (
            <p data-gc="voz.soundboard-panel.p--2" className="py-6 text-center text-sm text-ink-muted">
              Nenhum som ainda. Quem gerencia expressões pode subir até 8 em Configurações do
              servidor.
            </p>
          )}

          {data.sounds.length > 0 && !sons.length && (
            <p data-gc="voz.soundboard-panel.p--3" className="py-6 text-center text-sm text-ink-muted">Nenhum som com esse nome.</p>
          )}

          <div data-gc="voz.soundboard-panel.div--5" className="grid grid-cols-2 gap-2">
            {sons.map((som) => (
              <button data-gc="voz.soundboard-panel.button--3"
                key={som.id}
                disabled={!podeUsar || esperando || surdo}
                onClick={() => tocar(som.id)}
                title={som.name}
                className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-2 text-left transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span data-gc="voz.soundboard-panel.span--3" className="shrink-0 text-base leading-none">{som.emoji || "🔊"}</span>
                <span data-gc="voz.soundboard-panel.span--4" className="min-w-0 flex-1 truncate text-xs">{som.name}</span>
              </button>
            ))}
          </div>

          {!podeUsar && data.sounds.length > 0 && (
            <p data-gc="voz.soundboard-panel.p--4" className="mt-3 text-xs text-ink-faint">
              Você não tem a permissão “Usar efeitos sonoros” neste servidor.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
