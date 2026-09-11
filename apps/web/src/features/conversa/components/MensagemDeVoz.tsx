import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { VoiceWave } from "~/features/conversa/components/OndaDeVoz";
import { durationWriting, readWaves } from "~/features/conversa/lib/gravador-de-voz";
import { cn } from "~/lib/utils";

const SPEEDS = [1, 1.5, 2];

export const VoiceMessage: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [inSeconds, setSeconds] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setMuted] = useState(false);

  const total = (attachment.durationMs ?? 0) / 1000;
  const peaks = readWaves(attachment.waves);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (audio.current) audio.current.muted = isMuted;
  }, [isMuted]);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;

    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  const irFor = (event: React.MouseEvent<HTMLDivElement>) => {
    const el = audio.current;
    if (!el || !Number.isFinite(el.duration)) return;

    const box = event.currentTarget.getBoundingClientRect();
    el.currentTime = ((event.clientX - box.left) / box.width) * el.duration;
  };

  const elapsed = playing || inSeconds ? inSeconds : total;
  const progress = total ? Math.min(1, inSeconds / total) : 0;

  return (
    <div data-gc="conversa.mensagem-de-voz.div" className="mt-1 flex max-w-sm items-center gap-3 rounded-lg border border-line bg-surface-3 px-3 py-2">
      <button data-gc="conversa.mensagem-de-voz.button.toggle"
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pausar" : "Tocar"}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca transition hover:brightness-110"
      >
        {playing ? <Pause data-gc="conversa.mensagem-de-voz.pause" size={15} className="fill-current" /> : <Play data-gc="conversa.mensagem-de-voz.play" size={15} className="ml-0.5 fill-current" />}
      </button>

      <div data-gc="conversa.mensagem-de-voz.div.ir-for" className="min-w-0 flex-1 cursor-pointer" onClick={irFor}>
        <VoiceWave data-gc="conversa.mensagem-de-voz.voice-wave" peaks={peaks} progress={progress} />
      </div>

      <span data-gc="conversa.mensagem-de-voz.span" className="shrink-0 tabular-nums text-xs text-ink-faint">
        {durationWriting(elapsed * 1000)}
      </span>

      <button data-gc="conversa.mensagem-de-voz.button"
        type="button"
        onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!)}
        aria-label="Velocidade"
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-10 font-semibold tabular-nums transition",
          speed === 1 ? "text-ink-faint hover:bg-hover" : "bg-hover text-ink",
        )}
      >
        {speed}×
      </button>

      <audio data-gc="conversa.mensagem-de-voz.audio"
        ref={audio}
        src={attachment.url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setSeconds(0);
        }}
        onTimeUpdate={(e) => setSeconds(e.currentTarget.currentTime)}
      />
    </div>
  );
};
