import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Music2, Search, Volume2 } from "lucide-react";

import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { playSound } from "~/@core/lib/websocket/emit-voice";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { useVoicePrefs } from "~/stores/voice-prefs";

interface SoundboardPanelProps {
  guildId: string | undefined;
  podeUsar: boolean;
}

export const SoundboardPanel: React.FC<SoundboardPanelProps> = ({ guildId, podeUsar }) => {
  const { data } = useFindExpressions(guildId);
  const [busca, setBusca] = useState("");

  const volumeSaida = useVoicePrefs((s) => s.volumeSaida);

  const sons = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return data.sounds;

    return data.sounds.filter((som) => som.name.toLowerCase().includes(termo));
  }, [data.sounds, busca]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Efeitos sonoros"
          className="flex items-center justify-center rounded bg-surface-3 py-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
        >
          <Tooltip label="Abrir efeitos sonoros">
            <Music2 size={18} />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="center" className="w-80 p-0">
        <div className="flex items-center gap-2 border-b border-divisor p-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Encontre o som perfeito"
              className="h-9 pl-8 text-sm"
            />
          </div>

          <Tooltip label={`Toca no volume de saída (${Math.round(volumeSaida * 100)}%)`}>
            <span className="shrink-0 p-1 text-ink-faint">
              <Volume2 size={18} />
            </span>
          </Tooltip>
        </div>

        <div className="max-h-72 overflow-y-auto p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Sons do servidor
          </h3>

          {!data.sounds.length && (
            <p className="py-6 text-center text-sm text-ink-muted">
              Nenhum som ainda. Quem gerencia expressões pode subir até 8 em Configurações do
              servidor.
            </p>
          )}

          {data.sounds.length > 0 && !sons.length && (
            <p className="py-6 text-center text-sm text-ink-muted">Nenhum som com esse nome.</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {sons.map((som) => (
              <button
                key={som.id}
                disabled={!podeUsar}
                onClick={() => void playSound(som.id).catch((e: Error) => toast.error(e.message))}
                title={som.name}
                className="flex items-center gap-2 rounded bg-surface-0 px-2.5 py-2 text-left transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="shrink-0 text-base leading-none">{som.emoji ?? "🔊"}</span>
                <span className="min-w-0 flex-1 truncate text-xs">{som.name}</span>
              </button>
            ))}
          </div>

          {!podeUsar && data.sounds.length > 0 && (
            <p className="mt-3 text-xs text-ink-faint">
              Você não tem a permissão “Usar efeitos sonoros” neste servidor.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
