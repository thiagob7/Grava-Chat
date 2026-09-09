import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { OndaDeVoz } from "~/features/conversa/components/OndaDeVoz";
import { duracaoEscrita, lerOndas } from "~/features/conversa/lib/gravador-de-voz";
import { cn } from "~/lib/utils";

const VELOCIDADES = [1, 1.5, 2];

export const MensagemDeVoz: React.FC<{ anexo: Attachment }> = ({ anexo }) => {
  const audio = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);
  const [emSegundos, setEmSegundos] = useState(0);
  const [velocidade, setVelocidade] = useState(1);
  const [mudo, setMudo] = useState(false);

  const total = (anexo.duracaoMs ?? 0) / 1000;
  const picos = lerOndas(anexo.ondas);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = velocidade;
  }, [velocidade]);

  useEffect(() => {
    if (audio.current) audio.current.muted = mudo;
  }, [mudo]);

  const alternar = () => {
    const el = audio.current;
    if (!el) return;

    if (el.paused) void el.play().catch(() => undefined);
    else el.pause();
  };

  const irPara = (evento: React.MouseEvent<HTMLDivElement>) => {
    const el = audio.current;
    if (!el || !Number.isFinite(el.duration)) return;

    const caixa = evento.currentTarget.getBoundingClientRect();
    el.currentTime = ((evento.clientX - caixa.left) / caixa.width) * el.duration;
  };

  const decorrido = tocando || emSegundos ? emSegundos : total;
  const progresso = total ? Math.min(1, emSegundos / total) : 0;

  return (
    <div data-gc="conversa.mensagem-de-voz.div" className="mt-1 flex max-w-sm items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
      <button data-gc="conversa.mensagem-de-voz.button.alternar"
        type="button"
        onClick={alternar}
        aria-label={tocando ? "Pausar" : "Tocar"}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca transition hover:brightness-110"
      >
        {tocando ? <Pause data-gc="conversa.mensagem-de-voz.pause" size={15} className="fill-current" /> : <Play data-gc="conversa.mensagem-de-voz.play" size={15} className="ml-0.5 fill-current" />}
      </button>

      <div data-gc="conversa.mensagem-de-voz.div.ir-para" className="min-w-0 flex-1 cursor-pointer" onClick={irPara}>
        <OndaDeVoz data-gc="conversa.mensagem-de-voz.onda-de-voz" picos={picos} progresso={progresso} />
      </div>

      <span data-gc="conversa.mensagem-de-voz.span" className="shrink-0 tabular-nums text-xs text-ink-faint">
        {duracaoEscrita(decorrido * 1000)}
      </span>

      <button data-gc="conversa.mensagem-de-voz.button"
        type="button"
        onClick={() => setVelocidade(VELOCIDADES[(VELOCIDADES.indexOf(velocidade) + 1) % VELOCIDADES.length]!)}
        aria-label="Velocidade"
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-10 font-semibold tabular-nums transition",
          velocidade === 1 ? "text-ink-faint hover:bg-hover" : "bg-hover text-ink",
        )}
      >
        {velocidade}×
      </button>

      <audio data-gc="conversa.mensagem-de-voz.audio"
        ref={audio}
        src={anexo.url}
        preload="metadata"
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => {
          setTocando(false);
          setEmSegundos(0);
        }}
        onTimeUpdate={(e) => setEmSegundos(e.currentTarget.currentTime)}
      />
    </div>
  );
};
