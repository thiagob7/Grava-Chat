import React from "react";
import { toast } from "react-toastify";
import { Music2 } from "lucide-react";

import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import { playSound } from "~/@core/lib/websocket/emit-voice";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";

interface SoundboardPanelProps {
  guildId: string | undefined;
  /** sem USE_SOUNDBOARD o botão aparece desabilitado, e não some */
  podeUsar: boolean;
}

/**
 * O painel de efeitos sonoros da chamada.
 *
 * Apertar manda um recado pelo servidor e cada pessoa toca o arquivo. O som
 * NÃO entra na sua track de voz: republicar áudio a cada clique picotaria a
 * conversa de todo mundo.
 */
export const SoundboardPanel: React.FC<SoundboardPanelProps> = ({ guildId, podeUsar }) => {
  const { data } = useFindExpressions(guildId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Efeitos sonoros"
          className="flex items-center justify-center rounded bg-surface-3 py-2 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
        >
          <Tooltip label="Efeitos sonoros">
            <Music2 size={18} />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="center" className="w-72 p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Efeitos sonoros
        </h3>

        {!data.sounds.length && (
          <p className="py-6 text-center text-sm text-ink-muted">
            Nenhum som ainda. Quem gerencia expressões pode subir até 8 em Configurações do
            servidor.
          </p>
        )}

        <div className="grid grid-cols-4 gap-2">
          {data.sounds.map((som) => (
            <button
              key={som.id}
              disabled={!podeUsar}
              onClick={() => void playSound(som.id).catch((e: Error) => toast.error(e.message))}
              title={som.name}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded bg-surface-0 p-1 transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="text-xl leading-none">{som.emoji ?? "🔊"}</span>
              <span className="w-full truncate text-center text-[10px] text-ink-faint">
                {som.name}
              </span>
            </button>
          ))}
        </div>

        {!podeUsar && data.sounds.length > 0 && (
          <p className="mt-2 text-xs text-ink-faint">
            Você não tem a permissão “Usar efeitos sonoros” neste servidor.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};
