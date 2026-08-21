import { useEffect, useRef } from "react";
import type { Track } from "livekit-client";

/**
 * Liga uma track do LiveKit num elemento <video>/<audio>. O attach/detach tem
 * que acontecer no ciclo de vida do React: sem o detach na saída, a câmera do
 * usuário fica ligada (luz acesa) depois que o tile some da tela.
 */
export function VoiceVideo({ track, mirrored }: { track: Track; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={`size-full object-contain ${mirrored ? "-scale-x-100" : ""}`}
    />
  );
}

/** Áudio remoto. O LiveKit já cuida da reprodução, mas um elemento explícito
 *  evita o bloqueio de autoplay em alguns navegadores. */
export function VoiceAudio({ track }: { track: Track }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  return <audio ref={ref} autoPlay />;
}
