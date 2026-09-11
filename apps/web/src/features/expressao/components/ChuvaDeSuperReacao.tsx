import React, { useEffect, useMemo } from "react";

import { useSuperReaction, type Burst } from "~/features/expressao/stores/super-reacao";

const PARTICLES = 18;
const DURATION = 1400;

export const SuperReactionRain: React.FC = () => {
  const bursts = useSuperReaction((s) => s.bursts);

  if (!bursts.length) return null;

  return (
    <div data-gc="expressao.chuva-de-super-reacao.div" className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {bursts.map((burst) => (
        <Explode data-gc="expressao.chuva-de-super-reacao.explode" key={burst.id} burst={burst} />
      ))}
    </div>
  );
};

const Explode: React.FC<{ burst: Burst }> = ({ burst }) => {
  const end = useSuperReaction((s) => s.end);

  useEffect(() => {
    const timer = setTimeout(() => end(burst.id), DURATION);
    return () => clearTimeout(timer);
  }, [burst.id, end]);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (Math.PI * (0.15 + 0.7 * (i / (PARTICLES - 1)))) * -1;
        const force = 120 + Math.random() * 220;

        return {
          i,
          dx: Math.cos(angle) * force * (Math.random() < 0.5 ? -1 : 1),
          dy: Math.sin(angle) * force - Math.random() * 120,
          giro: -180 + Math.random() * 360,
          scale: 0.7 + Math.random() * 0.9,
          delay: Math.random() * 160,
        };
      }),
    [],
  );

  return (
    <>
      {particles.map((p) => (
        <span data-gc="expressao.chuva-de-super-reacao.span"
          key={p.i}
          className="absolute select-none text-2xl will-change-transform [animation:gc-super_1.4s_cubic-bezier(0.2,0.7,0.3,1)_forwards]"
          style={
            {
              left: burst.x,
              top: burst.y,
              animationDelay: `${p.delay}ms`,
              "--gc-dx": `${p.dx}px`,
              "--gc-dy": `${p.dy}px`,
              "--gc-giro": `${p.giro}deg`,
              "--gc-escala": p.scale,
            } as React.CSSProperties
          }
        >
          {burst.url ? (
            <img data-gc="expressao.chuva-de-super-reacao.img" src={burst.url} alt="" className="size-8 object-contain" />
          ) : (
            burst.emoji
          )}
        </span>
      ))}
    </>
  );
};
