import { useEffect, useRef } from "react";
import type { Track } from "livekit-client";

import { useVoiceStore } from "~/stores/voice-store";
import { useVoicePrefs } from "~/stores/voice-prefs";

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

export function VoiceAudio({
  track,
  identity,
  fonte = "voz",
}: {
  track: Track;
  identity: string;
  fonte?: "voz" | "tela";
}) {
  const ref = useRef<HTMLAudioElement>(null);

  const volumeSaida = useVoicePrefs((s) => s.volumeSaida);
  const individual = useVoiceStore((s) =>
    fonte === "tela" ? (s.volumesDeTela[identity] ?? 1) : (s.volumesLocais[identity] ?? 1),
  );
  const silenciado = useVoiceStore((s) =>
    fonte === "tela" ? false : Boolean(s.silenciadosLocais[identity]),
  );
  const deafened = useVoiceStore((s) => s.deafened);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    track.attach(el);
    return () => {
      track.detach(el);
    };
  }, [track]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.volume = silenciado || deafened ? 0 : Math.min(1, volumeSaida * individual);
  }, [track, volumeSaida, individual, silenciado, deafened]);

  return <audio ref={ref} autoPlay />;
}
