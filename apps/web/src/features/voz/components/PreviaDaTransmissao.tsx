import React, { useEffect, useRef, useState } from "react";
import type { Track } from "livekit-client";

const INTERVALO_MS = 3000;

export const PreviaDaTransmissao: React.FC<{ track: Track }> = ({ track }) => {
  const video = useRef<HTMLVideoElement>(null);
  const quadro = useRef<HTMLCanvasElement>(null);
  const [temQuadro, setTemQuadro] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;

    setTemQuadro(false);
    track.attach(el);

    return () => {
      track.detach(el);
    };
  }, [track]);

  useEffect(() => {
    let vivo = true;
    let agendado = 0;

    const capturar = () => {
      if (!vivo) return;

      const origem = video.current;
      const destino = quadro.current;

      if (origem && destino && origem.videoWidth > 0 && origem.videoHeight > 0) {
        if (destino.width !== origem.videoWidth) destino.width = origem.videoWidth;
        if (destino.height !== origem.videoHeight) destino.height = origem.videoHeight;

        const pincel = destino.getContext("2d");

        if (pincel) {
          pincel.drawImage(origem, 0, 0, destino.width, destino.height);
          setTemQuadro(true);
        }
      }

      agendado = window.setTimeout(capturar, INTERVALO_MS);
    };

    capturar();

    return () => {
      vivo = false;
      window.clearTimeout(agendado);
    };
  }, [track]);

  return (
    <>
      <video data-gc="voz.previa-da-transmissao.video"
        ref={video}
        autoPlay
        playsInline
        muted
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 size-px opacity-0"
      />
      <canvas data-gc="voz.previa-da-transmissao.canvas"
        ref={quadro}
        className={temQuadro ? "absolute inset-0 size-full object-contain" : "hidden"}
      />
    </>
  );
};
