import React, { useEffect, useRef } from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";

interface Dot {
  x: number;
  y: number;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  start: number;
}

const SPARK_LIFE = 400;
const RANGE = 15;

export const PointerEffects: React.FC = () => {
  const trailOn = useAppearance((s) => s.cursorTrail);
  const trailColor = useAppearance((s) => s.trailColor);
  const trailSize = useAppearance((s) => s.trailSize);
  const wisp = useAppearance((s) => s.trailWisp);

  const sparkOn = useAppearance((s) => s.clickSpark);
  const sparkColor = useAppearance((s) => s.sparkColor);
  const sparkSize = useAppearance((s) => s.sparkSize);
  const count = useAppearance((s) => s.countSparks);

  const reduce = useAppearance((s) => s.reduceAnimation);

  const display = useRef<HTMLCanvasElement>(null);
  const trail = useRef<Dot[]>([]);
  const sparks = useRef<Spark[]>([]);
  const pointer = useRef<Dot | null>(null);

  const on = (trailOn || sparkOn) && !reduce;

  useEffect(() => {
    if (!on) return;

    const follow = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };

    const burst = (event: PointerEvent) => {
      if (!sparkOn) return;

      const tempo = performance.now();

      for (let i = 0; i < count; i++) {
        sparks.current.push({
          x: event.clientX,
          y: event.clientY,
          angle: (2 * Math.PI * i) / count,
          start: tempo,
        });
      }
    };

    const vanish = () => {
      pointer.current = null;
      trail.current = [];
    };

    window.addEventListener("pointermove", follow, { passive: true });
    window.addEventListener("pointerdown", burst, { passive: true });
    window.addEventListener("pointerleave", vanish);

    return () => {
      window.removeEventListener("pointermove", follow);
      window.removeEventListener("pointerdown", burst);
      window.removeEventListener("pointerleave", vanish);
    };
  }, [on, sparkOn, count]);

  useEffect(() => {
    const canvas = display.current;
    if (!on || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;

    const measure = () => {
      const scale = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };

    measure();
    window.addEventListener("resize", measure);

    const draw = () => {
      frame = requestAnimationFrame(draw);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (trailOn) {
        if (pointer.current) trail.current.push({ ...pointer.current });
        while (trail.current.length > wisp) trail.current.shift();

        const points = trail.current;

        for (let i = 1; i < points.length; i++) {
          const force = i / points.length;

          context.beginPath();
          context.moveTo(points[i - 1]!.x, points[i - 1]!.y);
          context.lineTo(points[i]!.x, points[i]!.y);
          context.lineCap = "round";
          context.lineWidth = trailSize * force;
          context.strokeStyle = trailColor;
          context.globalAlpha = force * 0.7;
          context.stroke();
        }

        context.globalAlpha = 1;
      }

      if (sparkOn && sparks.current.length) {
        const tempo = performance.now();

        const limit = tempo - SPARK_LIFE;
        sparks.current = sparks.current.filter((spark) => spark.start > limit);

        for (const spark of sparks.current) {
          const step = (tempo - spark.start) / SPARK_LIFE;
          const distance = RANGE + step * sparkSize * 2;

          const x = spark.x + Math.cos(spark.angle) * distance;
          const y = spark.y + Math.sin(spark.angle) * distance;

          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(
            x + Math.cos(spark.angle) * sparkSize * (1 - step),
            y + Math.sin(spark.angle) * sparkSize * (1 - step),
          );
          context.lineCap = "round";
          context.lineWidth = 2;
          context.strokeStyle = sparkColor;
          context.globalAlpha = 1 - step;
          context.stroke();
        }

        context.globalAlpha = 1;
      }
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [
    on,
    trailOn,
    trailColor,
    trailSize,
    wisp,
    sparkOn,
    sparkColor,
    sparkSize,
  ]);

  if (!on) return null;

  return (
    <canvas data-gc="app.efeitos-do-ponteiro.canvas"
      ref={display}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100]"
    />
  );
};
