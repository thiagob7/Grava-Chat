import React, { useEffect, useState } from "react";

export const CallTimer: React.FC<{ since: number }> = ({ since }) => {
  const [now, setNow] = useState(() => Date.now());
  const valid = Number.isFinite(since) && since > 0;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const untilNextSecond = 1000 - (Date.now() % 1000);

    let clock: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      tick();
      clock = setInterval(tick, 1000);
    }, untilNextSecond);

    return () => {
      clearTimeout(start);
      clearInterval(clock);
    };
  }, []);

  if (!valid) return null;

  return (
    <span data-gc="voz.call-timer.span" className="shrink-0 font-mono text-xs tabular-nums text-online">
      {formatDuration(now - since)}
    </span>
  );
};

export function formatDuration(ms: number): string {
  const total = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
