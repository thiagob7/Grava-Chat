import React, { useEffect, useRef, useState } from "react";
import type { Track } from "livekit-client";

const INTERVAL_MS = 3000;

export const BroadcastPreview: React.FC<{ track: Track }> = ({ track }) => {
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLCanvasElement>(null);
  const [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;

    setHasFrame(false);
    track.attach(el);

    return () => {
      track.detach(el);
    };
  }, [track]);

  useEffect(() => {
    let live = true;
    let scheduled = 0;

    const capture = () => {
      if (!live) return;

      const origin = video.current;
      const destination = frame.current;

      if (origin && destination && origin.videoWidth > 0 && origin.videoHeight > 0) {
        if (destination.width !== origin.videoWidth) destination.width = origin.videoWidth;
        if (destination.height !== origin.videoHeight) destination.height = origin.videoHeight;

        const brush = destination.getContext("2d");

        if (brush) {
          brush.drawImage(origin, 0, 0, destination.width, destination.height);
          setHasFrame(true);
        }
      }

      scheduled = window.setTimeout(capture, INTERVAL_MS);
    };

    capture();

    return () => {
      live = false;
      window.clearTimeout(scheduled);
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
        ref={frame}
        className={hasFrame ? "absolute inset-0 size-full object-contain" : "hidden"}
      />
    </>
  );
};
