import { useEffect, useRef, useState } from "react";
import { ConnectionQuality, Track, type LocalTrack } from "livekit-client";

import { useVoiceStore } from "~/features/voz/stores/voice-store";

const INTERVALO_MS = 3000;

const AMOSTRAS = 80;

export interface PingDaChamada {
  ms: number | null;
  media: number | null;
  perda: number | null;
  qualidade: ConnectionQuality;
  historico: (number | null)[];
}

const VAZIO: PingDaChamada = {
  ms: null,
  media: null,
  perda: null,
  qualidade: ConnectionQuality.Unknown,
  historico: [],
};

export function useVoicePing(): PingDaChamada {
  const room = useVoiceStore((s) => s.room);
  const [ping, setPing] = useState<PingDaChamada>(VAZIO);

  const anterior = useRef<{ perdidos: number; enviados: number } | null>(null);

  useEffect(() => {
    if (!room) {
      setPing(VAZIO);
      anterior.current = null;
      return;
    }

    let vivo = true;

    const medir = async () => {
      const publicacao = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const track = publicacao?.track as LocalTrack | undefined;
      const qualidade = room.localParticipant.connectionQuality;

      let rtt: number | null = null;
      let perda: number | null = null;

      try {
        const relatorio = await track?.getRTCStatsReport();

        relatorio?.forEach((entrada) => {
          if (entrada.type === "candidate-pair" && entrada.state === "succeeded") {
            const valor = (entrada as { currentRoundTripTime?: number }).currentRoundTripTime;
            if (typeof valor === "number") rtt = Math.round(valor * 1000);
          }

          if (entrada.type === "outbound-rtp") {
            const e = entrada as { packetsSent?: number };
            const enviados = e.packetsSent ?? 0;
            const perdidos =
              (entrada as unknown as { retransmittedPacketsSent?: number }).retransmittedPacketsSent ?? 0;

            const antes = anterior.current;
            if (antes && enviados > antes.enviados) {
              const dEnviados = enviados - antes.enviados;
              const dPerdidos = Math.max(0, perdidos - antes.perdidos);
              perda = Math.min(100, (dPerdidos / dEnviados) * 100);
            }

            anterior.current = { perdidos, enviados };
          }
        });
      } catch {
      }

      if (!vivo) return;

      setPing((atual) => {
        const historico = [...atual.historico, rtt].slice(-AMOSTRAS);
        const validos = historico.filter((v): v is number => v !== null);

        return {
          ms: rtt,
          media: validos.length
            ? Math.round(validos.reduce((a, b) => a + b, 0) / validos.length)
            : null,
          perda: perda ?? atual.perda,
          qualidade,
          historico,
        };
      });
    };

    void medir();
    const relogio = setInterval(() => void medir(), INTERVALO_MS);

    return () => {
      vivo = false;
      clearInterval(relogio);
    };
  }, [room]);

  return ping;
}

export function corDoPing({ ms, qualidade }: Pick<PingDaChamada, "ms" | "qualidade">): string {
  if (ms !== null) {
    if (ms <= 100) return "text-online";
    if (ms <= 200) return "text-idle";
    return "text-danger";
  }

  if (qualidade === ConnectionQuality.Excellent || qualidade === ConnectionQuality.Good) {
    return "text-online";
  }
  if (qualidade === ConnectionQuality.Poor) return "text-idle";
  if (qualidade === ConnectionQuality.Lost) return "text-danger";

  return "text-ink-faint";
}
