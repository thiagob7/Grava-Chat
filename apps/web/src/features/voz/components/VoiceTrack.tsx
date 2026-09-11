import { useEffect, useRef } from "react";
import type { Track } from "livekit-client";

import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";

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
    <video data-gc="voz.voice-track.video"
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
  font = "voz",
}: {
  track: Track;
  identity: string;
  font?: "voz" | "tela";
}) {
  const ref = useRef<HTMLAudioElement>(null);

  const volumeOutput = useVoicePrefs((s) => s.volumeOutput);
  const individual = useVoiceStore((s) =>
    font === "tela" ? (s.screenVolumes[identity] ?? 1) : (s.volumesLocal[identity] ?? 1),
  );
  const muted = useVoiceStore((s) =>
    font === "tela" ? false : Boolean(s.mutedLocal[identity]),
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

    el.volume = muted || deafened ? 0 : Math.min(1, volumeOutput * individual);
  }, [track, volumeOutput, individual, muted, deafened]);

  return <audio data-gc="voz.voice-track.audio" ref={ref} autoPlay />;
}
