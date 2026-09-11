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
  canUse: boolean;
}

export const SoundboardPanel: React.FC<SoundboardPanelProps> = ({ guildId, canUse }) => {
  const { data } = useFindExpressions(guildId);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const deafened = useVoiceStore((s) => s.deafened);
  const panelSound = useVoicePrefs((s) => s.panelSound);
  const panelVolume = useVoicePrefs((s) => s.panelVolume);
  const set = useVoicePrefs((s) => s.set);

  const [volumeIsOpen, setVolumeIsOpen] = useState(false);

  const leaving = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showVolume = () => {
    clearTimeout(leaving.current);
    setVolumeIsOpen(true);
  };

  const hideVolume = () => {
    clearTimeout(leaving.current);
    leaving.current = setTimeout(() => setVolumeIsOpen(false), 220);
  };

  const [waiting, setWaiting] = useState(false);
  const clock = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(clock.current);
      clearTimeout(leaving.current);
    },
    [],
  );

  const play = (id: string) => {
    if (waiting) return;

    setWaiting(true);
    clearTimeout(clock.current);
    clock.current = setTimeout(() => setWaiting(false), LIMITS.soundWaitMs);

    void playSound(id).catch((e: Error) => toast.error(e.message));
  };

  const sounds = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data.sounds;

    return data.sounds.filter((sound) => sound.name.toLowerCase().includes(term));
  }, [data.sounds, search]);

  const percent = Math.round(panelVolume * 100);

  useEffect(() => {
    if (deafened) setIsOpen(false);
  }, [deafened]);

  return (
    <Popover data-gc="voz.soundboard-panel.popover.set-is-open" open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger data-gc="voz.soundboard-panel.popover-trigger" asChild>
        <button data-gc="voz.soundboard-panel.button"
          aria-label="Efeitos sonoros"
          aria-disabled={deafened}
          onClick={(e) => deafened && e.preventDefault()}
          className={cn(
            "flex items-center justify-center rounded-lg bg-hover py-2 text-ink-muted transition",
            deafened ? "cursor-not-allowed opacity-40" : "hover:bg-surface-4 hover:text-ink",
          )}
        >
          <Tooltip data-gc="voz.soundboard-panel.tooltip"
            label={deafened ? "Ative o áudio pra usar os efeitos sonoros" : "Abrir efeitos sonoros"}
          >
            <Music2 data-gc="voz.soundboard-panel.music2" size={18} />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent data-gc="voz.soundboard-panel.popover-content" side="top" align="center" collisionPadding={12} className="w-[min(21rem,92vw)] p-0">
        <div data-gc="voz.soundboard-panel.div" className="flex items-center gap-2 border-b border-divisor p-3">
          <div data-gc="voz.soundboard-panel.div--2" className="relative flex-1">
            <Search data-gc="voz.soundboard-panel.search"
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input data-gc="voz.soundboard-panel.input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Encontre o som perfeito"
              className="h-9 border-transparent pl-8 text-sm shadow-none focus-visible:border-line-sutil focus-visible:ring-0"
            />
          </div>

          <div data-gc="voz.soundboard-panel.div.show-volume"
            className="shrink-0"
            onMouseEnter={showVolume}
            onMouseLeave={hideVolume}
          >
            <Popover data-gc="voz.soundboard-panel.popover.set-volume-is-open" open={volumeIsOpen} onOpenChange={setVolumeIsOpen}>
              <PopoverAnchor data-gc="voz.soundboard-panel.popover-anchor" asChild>
                <button data-gc="voz.soundboard-panel.button--2"
                  type="button"
                  aria-pressed={!panelSound}
                  aria-label={panelSound ? "Desativar os sons" : "Ativar os sons"}
                  onClick={() => set({ panelSound: !panelSound })}
                  className={cn(
                    "p-1 transition",
                    panelSound ? "text-ink-muted hover:text-ink" : "text-danger hover:text-danger/80",
                  )}
                >
                  {panelSound ? <Volume2 data-gc="voz.soundboard-panel.volume2" size={20} /> : <VolumeX data-gc="voz.soundboard-panel.volume-x" size={20} />}
                </button>
              </PopoverAnchor>

              <PopoverContent data-gc="voz.soundboard-panel.popover-content.show-volume"
                side="right"
                align="center"
                sideOffset={6}
                onMouseEnter={showVolume}
                onMouseLeave={hideVolume}
                portal={false}
                collisionPadding={12}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="w-60 p-3"
              >
                <PopoverArrow data-gc="voz.soundboard-panel.popover-arrow" />

                <div data-gc="voz.soundboard-panel.div--3" className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span data-gc="voz.soundboard-panel.span" className="font-medium text-ink-muted">Volume dos efeitos sonoros</span>
                  <span data-gc="voz.soundboard-panel.span--2" className="shrink-0 tabular-nums text-ink-faint">
                    {panelSound ? `${percent}%` : "mudo"}
                  </span>
                </div>

                <Slider data-gc="voz.soundboard-panel.slider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={panelVolume}
                  filled={panelSound ? panelVolume : 0}
                  disabled={!panelSound}
                  aria-label="Volume dos efeitos sonoros"
                  onChange={(e) => set({ panelVolume: Number(e.target.value) })}
                  className={panelSound ? undefined : "opacity-50"}
                />

                <p data-gc="voz.soundboard-panel.p" className="mt-2.5 text-11 leading-snug text-ink-faint">
                  {panelSound
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

          {data.sounds.length > 0 && !sounds.length && (
            <p data-gc="voz.soundboard-panel.p--3" className="py-6 text-center text-sm text-ink-muted">Nenhum som com esse nome.</p>
          )}

          <div data-gc="voz.soundboard-panel.div--5" className="grid grid-cols-2 gap-2">
            {sounds.map((sound) => (
              <button data-gc="voz.soundboard-panel.button--3"
                key={sound.id}
                disabled={!canUse || waiting || deafened}
                onClick={() => play(sound.id)}
                title={sound.name}
                className="flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-2 text-left transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span data-gc="voz.soundboard-panel.span--3" className="shrink-0 text-base leading-none">{sound.emoji || "🔊"}</span>
                <span data-gc="voz.soundboard-panel.span--4" className="min-w-0 flex-1 truncate text-xs">{sound.name}</span>
              </button>
            ))}
          </div>

          {!canUse && data.sounds.length > 0 && (
            <p data-gc="voz.soundboard-panel.p--4" className="mt-3 text-xs text-ink-faint">
              Você não tem a permissão “Usar efeitos sonoros” neste servidor.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
