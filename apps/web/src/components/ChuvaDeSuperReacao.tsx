import React, { useEffect, useMemo } from "react";

import { useSuperReacao, type Explosao } from "~/stores/super-reacao";

const PARTICULAS = 18;
const DURACAO = 1400;

export const ChuvaDeSuperReacao: React.FC = () => {
  const explosoes = useSuperReacao((s) => s.explosoes);

  if (!explosoes.length) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {explosoes.map((explosao) => (
        <Explode key={explosao.id} explosao={explosao} />
      ))}
    </div>
  );
};

const Explode: React.FC<{ explosao: Explosao }> = ({ explosao }) => {
  const encerrar = useSuperReacao((s) => s.encerrar);

  useEffect(() => {
    const timer = setTimeout(() => encerrar(explosao.id), DURACAO);
    return () => clearTimeout(timer);
  }, [explosao.id, encerrar]);

  const particulas = useMemo(
    () =>
      Array.from({ length: PARTICULAS }, (_, i) => {
        const angulo = (Math.PI * (0.15 + 0.7 * (i / (PARTICULAS - 1)))) * -1;
        const forca = 120 + Math.random() * 220;

        return {
          i,
          dx: Math.cos(angulo) * forca * (Math.random() < 0.5 ? -1 : 1),
          dy: Math.sin(angulo) * forca - Math.random() * 120,
          giro: -180 + Math.random() * 360,
          escala: 0.7 + Math.random() * 0.9,
          atraso: Math.random() * 160,
        };
      }),
    [],
  );

  return (
    <>
      {particulas.map((p) => (
        <span
          key={p.i}
          className="absolute select-none text-2xl will-change-transform [animation:gc-super_1.4s_cubic-bezier(0.2,0.7,0.3,1)_forwards]"
          style={
            {
              left: explosao.x,
              top: explosao.y,
              animationDelay: `${p.atraso}ms`,
              "--gc-dx": `${p.dx}px`,
              "--gc-dy": `${p.dy}px`,
              "--gc-giro": `${p.giro}deg`,
              "--gc-escala": p.escala,
            } as React.CSSProperties
          }
        >
          {explosao.url ? (
            <img src={explosao.url} alt="" className="size-8 object-contain" />
          ) : (
            explosao.emoji
          )}
        </span>
      ))}
    </>
  );
};
