import React, { useEffect, useState } from "react";

/**
 * Há quanto tempo a chamada está rolando.
 *
 * O começo é o menor `joinedAt` de quem está no canal — quem chegou primeiro
 * define o início. Vem do servidor, então recarregar a página não zera o
 * relógio, e todo mundo vê o mesmo número.
 */
export const CallTimer: React.FC<{ desde: number }> = ({ desde }) => {
  const [agora, setAgora] = useState(() => Date.now());
  const valido = Number.isFinite(desde) && desde > 0;

  useEffect(() => {
    /**
     * O intervalo é alinhado ao próximo segundo cheio em vez de disparar a cada
     * 1000ms a partir de agora: sem isso o relógio pula números de vez em
     * quando, porque o `setInterval` acumula atraso e às vezes atravessa dois
     * segundos entre dois disparos.
     */
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

  // segunda linha de defesa: melhor não mostrar relógio do que mostrar "NaN:NaN"
  if (!valido) return null;

  return (
    <span className="shrink-0 font-mono text-xs tabular-nums text-online">
      {formatarDuracao(agora - desde)}
    </span>
  );
};

/** `H:MM:SS` depois de uma hora, `MM:SS` antes — como o Discord. */
export function formatarDuracao(ms: number): string {
  // `Math.max(0, NaN)` devolve NaN, não 0 — a checagem tem que vir antes
  const total = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;

  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;

  const mm = String(minutos).padStart(2, "0");
  const ss = String(segundos).padStart(2, "0");

  return horas > 0 ? `${horas}:${mm}:${ss}` : `${mm}:${ss}`;
}
