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

/**
 * O áudio de uma pessoa na chamada — e o volume dela.
 *
 * O volume era ajustado pelo LiveKit (`participante.setVolume`), e por isso
 * ele sumia sozinho: quem toca o som é ESTE elemento, criado pelo React, e
 * cada vez que a pessoa saía e voltava nascia um elemento novo, no volume 1.
 * O `setVolume` tinha acontecido no elemento anterior, que já não existia
 * mais — daí o bot de música voltar gritando toda vez que reentrava na call.
 *
 * Agora o ajuste mora aqui e é reaplicado a cada mudança: elemento novo nasce
 * já no volume certo, e mexer no controle chega neste `useEffect` na hora.
 */
export function VoiceAudio({ track, identity }: { track: Track; identity: string }) {
  const ref = useRef<HTMLAudioElement>(null);

  const volumeSaida = useVoicePrefs((s) => s.volumeSaida);
  const individual = useVoiceStore((s) => s.volumesLocais[identity] ?? 1);
  const silenciado = useVoiceStore((s) => Boolean(s.silenciadosLocais[identity]));
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

    /*
      `volume` de um elemento de áudio vai de 0 a 1 — não existe "mais que o
      original" aqui. Por isso o controle na tela para em 100%: prometer 200%
      e entregar 100% seria pior que não ter o controle.
    */
    el.volume = silenciado || deafened ? 0 : Math.min(1, volumeSaida * individual);
  }, [track, volumeSaida, individual, silenciado, deafened]);

  return <audio ref={ref} autoPlay />;
}
