import React, { useEffect, useState } from "react";
import type { Track } from "livekit-client";

export const QualidadeDaTela: React.FC<{ track: Track }> = ({ track }) => {
  const [medida, setMedida] = useState<{ altura: number; fps: number | null } | null>(null);

  useEffect(() => {
    const medir = () => {
      const ajustes = track.mediaStreamTrack?.getSettings?.();
      const altura = ajustes?.height ?? 0;

      setMedida(altura > 0 ? { altura, fps: ajustes?.frameRate ? Math.round(ajustes.frameRate) : null } : null);
    };

    medir();
    const relogio = setInterval(medir, 3000);
    return () => clearInterval(relogio);
  }, [track]);

  if (!medida) return null;

  return (
    <span data-gc="voz.qualidade-da-tela.span" className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-10 font-semibold text-white/90">
      {medida.altura}p{medida.fps ? ` · ${medida.fps} fps` : ""}
    </span>
  );
};
