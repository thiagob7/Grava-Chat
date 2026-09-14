import React, { useEffect } from "react";
import { Mic, Send, Trash2 } from "lucide-react";

import { IconButton } from "~/components/ui/button";
import { VoiceWave } from "~/features/conversa/components/OndaDeVoz";
import { useVoiceRecorder, type NoteRecorded } from "~/features/conversa/hooks/use-gravador-de-voz";
import { durationWriting, LIMIT_MS } from "~/features/conversa/lib/gravador-de-voz";
import { BoxButton } from "~/features/conversa/components/AcoesDaCaixa";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

export const RecordingBar: React.FC<{
  off?: boolean;
  onReady: (note: NoteRecorded) => void;
  onRecordingChanged?: (recording: boolean) => void;
}> = ({ off, onReady, onRecordingChanged }) => {
  const { t } = useTranslation();
  const { recording, ms, peaks, error, start, stop } = useVoiceRecorder();

  useEffect(() => onRecordingChanged?.(recording), [recording, onRecordingChanged]);

  const end = async (keep: boolean) => {
    const note = await stop(keep);
    if (note) onReady(note);
  };

  if (!recording) {
    return (
      <BoxButton data-gc="conversa.barra-de-gravacao.box-button" label={t("conversa.recado.gravar")} off={off} onClick={() => void start()}>
        <Mic data-gc="conversa.barra-de-gravacao.mic" size={20} />
      </BoxButton>
    );
  }

  const near = ms > LIMIT_MS - 15_000;

  return (
    <div data-gc="conversa.barra-de-gravacao.div" className="flex min-w-0 flex-1 items-center gap-3 px-2">
      <IconButton data-gc="conversa.barra-de-gravacao.icon-button"
        onClick={() => void end(false)}
        label={t("conversa.recado.descartar")}
        className="size-[30px] rounded text-ink-faint hover:text-danger [&_svg]:size-[18px]"
      >
        <Trash2 data-gc="conversa.barra-de-gravacao.trash2" />
      </IconButton>

      <span data-gc="conversa.barra-de-gravacao.span" className="flex size-2 shrink-0 items-center justify-center">
        <span data-gc="conversa.barra-de-gravacao.span--2" className="size-2 animate-pulse rounded-full bg-danger" />
      </span>

      <VoiceWave data-gc="conversa.barra-de-gravacao.voice-wave" peaks={peaks} live />

      <span data-gc="conversa.barra-de-gravacao.span--3" className={cn("shrink-0 tabular-nums text-xs", near ? "text-danger" : "text-ink-faint")}>
        {durationWriting(ms)} / {durationWriting(LIMIT_MS)}
      </span>

      <IconButton data-gc="conversa.barra-de-gravacao.icon-button--2"
        variant="primary"
        round
        onClick={() => void end(true)}
        label={t("conversa.recado.mandar")}
        className="[&_svg]:size-[15px]"
      >
        <Send data-gc="conversa.barra-de-gravacao.send" />
      </IconButton>

      {error && <span data-gc="conversa.barra-de-gravacao.span--4" className="shrink-0 text-xs text-danger">{error}</span>}
    </div>
  );
};
