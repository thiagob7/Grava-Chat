import React, { useEffect, useState } from "react";

export const CallTimer: React.FC<{ desde: number }> = ({ desde }) => {
  const [agora, setAgora] = useState(() => Date.now());
  const valido = Number.isFinite(desde) && desde > 0;

  useEffect(() => {
    const tique = () => setAgora(Date.now());
    const ateOProximoSegundo = 1000 - (Date.now() % 1000);

    let relogio: ReturnType<typeof setInterval>;
    const inicio = setTimeout(() => {
      tique();
      relogio = setInterval(tique, 1000);
    }, ateOProximoSegundo);

    return () => {
      clearTimeout(inicio);
      clearInterval(relogio);
    };
  }, []);

  if (!valido) return null;

  return (
    <span data-gc="voz.call-timer.span" className="shrink-0 font-mono text-xs tabular-nums text-online">
      {formatarDuracao(agora - desde)}
    </span>
  );
};

export function formatarDuracao(ms: number): string {
  const total = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  const mm = String(minutos).padStart(2, "0");
  const ss = String(segundos).padStart(2, "0");

  return horas > 0 ? `${horas}:${mm}:${ss}` : `${mm}:${ss}`;
}
