import { useCallback, useEffect, useRef, useState } from "react";

import {
  fitWaves,
  writeWaves,
  formatExtension,
  formatRecording,
  LIMIT_MS,
  VOICE_RATE,
} from "~/features/conversa/lib/gravador-de-voz";
import { i18next } from "~/traducao";

export interface NoteRecorded {
  file: File;
  durationMs: number;
  waves: string;
}

const STEP_MS = 50;

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [ms, setMs] = useState(0);
  const [peaks, setPeaks] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const trail = useRef<MediaStream | null>(null);
  const context = useRef<AudioContext | null>(null);
  const clock = useRef<ReturnType<typeof setInterval> | null>(null);
  const pieces = useRef<Blob[]>([]);
  const measured = useRef<number[]>([]);
  const started = useRef(0);

  const turnoff = useCallback(() => {
    if (clock.current) clearInterval(clock.current);
    clock.current = null;

    trail.current?.getTracks().forEach((t) => t.stop());
    trail.current = null;

    void context.current?.close().catch(() => undefined);
    context.current = null;
  }, []);

  useEffect(() => turnoff, [turnoff]);

  const start = useCallback(async () => {
    setError(null);

    const format = formatRecording((kind) => MediaRecorder.isTypeSupported(kind));
    if (!format) {
      setError(i18next.t("conversa.recado.semSuporte"));
      return false;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setError(i18next.t("conversa.recado.semMicrofone"));
      return false;
    }

    trail.current = stream;
    pieces.current = [];
    measured.current = [];
    started.current = Date.now();

    const ctx = new AudioContext();
    context.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);

    const sample = new Uint8Array(analyser.frequencyBinCount);

    const rec = new MediaRecorder(stream, { mimeType: format, audioBitsPerSecond: VOICE_RATE });
    rec.ondataavailable = (e) => e.data.size && pieces.current.push(e.data);
    rec.start(250);
    recorder.current = rec;

    clock.current = setInterval(() => {
      analyser.getByteTimeDomainData(sample);

      let larger = 0;
      for (const v of sample) larger = Math.max(larger, Math.abs(v - 128) / 128);

      measured.current.push(larger);
      setPeaks([...measured.current]);

      const passado = Date.now() - started.current;
      setMs(passado);

      if (passado >= LIMIT_MS) rec.stop();
    }, STEP_MS);

    setRecording(true);
    return true;
  }, []);

  const stop = useCallback(
    (keep = true): Promise<NoteRecorded | null> => {
      const rec = recorder.current;
      if (!rec) return Promise.resolve(null);

      return new Promise((resolve) => {
        rec.onstop = () => {
          const durationMs = Math.min(Date.now() - started.current, LIMIT_MS);
          const kind = rec.mimeType || "audio/webm";
          const blob = new Blob(pieces.current, { type: kind });

          turnoff();
          recorder.current = null;
          setRecording(false);
          setMs(0);
          setPeaks([]);

          if (!keep || !blob.size) return resolve(null);

          resolve({
            file: new File([blob], `recado.${formatExtension(kind)}`, { type: kind }),
            durationMs,
            waves: writeWaves(fitWaves(measured.current)),
          });
        };

        rec.state === "inactive" ? rec.onstop?.(new Event("stop")) : rec.stop();
      });
    },
    [turnoff],
  );

  return { recording, ms, peaks, error, start, stop };
}
