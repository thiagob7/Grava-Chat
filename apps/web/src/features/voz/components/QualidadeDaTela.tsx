import React, { useEffect, useState } from "react";
import type { Track } from "livekit-client";

export const ScreenQuality: React.FC<{ track: Track }> = ({ track }) => {
  const [measure, setMeasure] = useState<{ height: number; fps: number | null } | null>(null);

  useEffect(() => {
    const measure = () => {
      const settings = track.mediaStreamTrack?.getSettings?.();
      const height = settings?.height ?? 0;

      setMeasure(height > 0 ? { height, fps: settings?.frameRate ? Math.round(settings.frameRate) : null } : null);
    };

    measure();
    const clock = setInterval(measure, 3000);
    return () => clearInterval(clock);
  }, [track]);

  if (!measure) return null;

  return (
    <span data-gc="voz.qualidade-da-tela.span" className="shrink-0 rounded bg-palco-ink/15 px-1.5 py-0.5 text-10 font-semibold text-palco-ink/90">
      {measure.height}p{measure.fps ? ` · ${measure.fps} fps` : ""}
    </span>
  );
};
