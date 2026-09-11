import { useEffect, useRef, useState } from "react";
import { ConnectionQuality, Track, type LocalTrack } from "livekit-client";

import { useVoiceStore } from "~/features/voz/stores/voice-store";

const INTERVAL_MS = 3000;

const SAMPLES = 80;

export interface CallPing {
  ms: number | null;
  media: number | null;
  loss: number | null;
  quality: ConnectionQuality;
  past: (number | null)[];
}

const EMPTY: CallPing = {
  ms: null,
  media: null,
  loss: null,
  quality: ConnectionQuality.Unknown,
  past: [],
};

export function useVoicePing(): CallPing {
  const room = useVoiceStore((s) => s.room);
  const [ping, setPing] = useState<CallPing>(EMPTY);

  const anterior = useRef<{ lost: number; sent: number } | null>(null);

  useEffect(() => {
    if (!room) {
      setPing(EMPTY);
      anterior.current = null;
      return;
    }

    let live = true;

    const measure = async () => {
      const post = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const track = post?.track as LocalTrack | undefined;
      const quality = room.localParticipant.connectionQuality;

      let rtt: number | null = null;
      let loss: number | null = null;

      try {
        const report = await track?.getRTCStatsReport();

        report?.forEach((entry) => {
          if (entry.type === "candidate-pair" && entry.state === "succeeded") {
            const value = (entry as { currentRoundTripTime?: number }).currentRoundTripTime;
            if (typeof value === "number") rtt = Math.round(value * 1000);
          }

          if (entry.type === "outbound-rtp") {
            const e = entry as { packetsSent?: number };
            const sent = e.packetsSent ?? 0;
            const lost =
              (entry as unknown as { retransmittedPacketsSent?: number }).retransmittedPacketsSent ?? 0;

            const before = anterior.current;
            if (before && sent > before.sent) {
              const dSent = sent - before.sent;
              const dLost = Math.max(0, lost - before.lost);
              loss = Math.min(100, (dLost / dSent) * 100);
            }

            anterior.current = { lost, sent };
          }
        });
      } catch {
      }

      if (!live) return;

      setPing((current) => {
        const past = [...current.past, rtt].slice(-SAMPLES);
        const valid = past.filter((v): v is number => v !== null);

        return {
          ms: rtt,
          media: valid.length
            ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
            : null,
          loss: loss ?? current.loss,
          quality,
          past,
        };
      });
    };

    void measure();
    const clock = setInterval(() => void measure(), INTERVAL_MS);

    return () => {
      live = false;
      clearInterval(clock);
    };
  }, [room]);

  return ping;
}

export function pingColor({ ms, quality }: Pick<CallPing, "ms" | "quality">): string {
  if (ms !== null) {
    if (ms <= 100) return "text-online";
    if (ms <= 200) return "text-idle";
    return "text-danger";
  }

  if (quality === ConnectionQuality.Excellent || quality === ConnectionQuality.Good) {
    return "text-online";
  }
  if (quality === ConnectionQuality.Poor) return "text-idle";
  if (quality === ConnectionQuality.Lost) return "text-danger";

  return "text-ink-faint";
}
