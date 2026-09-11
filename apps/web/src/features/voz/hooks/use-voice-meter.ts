import { useEffect, useRef, useState } from "react";

import { createTestMeter } from "~/features/voz/lib/audio-gate";
import { useVoicePrefs } from "~/features/voz/stores/voice-prefs";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

interface Measurement {
  level: number;
  isOpen: boolean;
  error: string | null;
  stream: MediaStream | null;
}

export function useVoiceMeter(active: boolean): Measurement {
  const inCall = useVoiceStore((s) => s.channelId !== null);
  const observeLevel = useVoiceStore((s) => s.observeLevel);
  const prefs = useVoicePrefs();

  const [measurement, setMeasurement] = useState<Measurement>({
    level: 0,
    isOpen: false,
    error: null,
    stream: null,
  });

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    if (!active) {
      setMeasurement({ level: 0, isOpen: false, error: null, stream: null });
      return;
    }

    if (inCall) {
      return observeLevel((level, isOpen) =>
        setMeasurement((current) => ({ ...current, level, isOpen, error: null })),
      );
    }

    let live = true;
    let stop: (() => void) | null = null;
    let clock: ReturnType<typeof setInterval> | null = null;

    void createTestMeter(
      prefsRef.current.entryId ?? undefined,
      prefsRef.current.noiseSuppression,
    )
      .then((meter) => {
        if (!live) return meter.stop();

        stop = meter.stop;
        setMeasurement((current) => ({ ...current, stream: meter.stream, error: null }));

        clock = setInterval(() => {
          const level = meter.read();
          const { mode, sensitivityAutomatic, threshold } = prefsRef.current;

          const isOpen =
            mode === "ptt" ? false : level >= (sensitivityAutomatic ? 0.05 : threshold);

          setMeasurement((current) => ({ ...current, level, isOpen }));
        }, 60);
      })
      .catch(() =>
        setMeasurement({
          level: 0,
          isOpen: false,
          stream: null,
          error: "Não deu pra abrir o microfone. Confira a permissão no navegador.",
        }),
      );

    return () => {
      live = false;
      if (clock) clearInterval(clock);
      stop?.();
    };
  }, [active, inCall, observeLevel]);

  return measurement;
}
