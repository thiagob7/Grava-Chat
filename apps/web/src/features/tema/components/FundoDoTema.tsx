import React, { useEffect, useRef, useState } from "react";

import { THEME_APPLIED } from "~/features/configuracoes/lib/evento-de-tema";
import {
  ENGINES,
  layerRequestedByTheme,
  motorRequestByTheme,
  type Stage,
} from "~/features/tema/lib/fundos";

const STEP_MAX = 1 / 20;

/*
  A tela onde os motores de fundo desenham. Fica atrás do app inteiro e só
  existe quando o tema aplicado pede um pelo nome.

  Nada aqui responde ao mouse: `pointer-events: none` porque uma camada em
  cima da tela toda comeria o clique do app. Quem quiser clicar para soltar
  um foguete perde o app inteiro, e não vale a troca.
*/
export const ThemeBackground: React.FC = () => {
  const [name, setName] = useState<string | null>(null);
  const [layer, setLayer] = useState<"frente" | "fundo">("fundo");
  const display = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const read = () => {
      setName(motorRequestByTheme());
      setLayer(layerRequestedByTheme());
    };

    read();
    window.addEventListener(THEME_APPLIED, read);
    return () => window.removeEventListener(THEME_APPLIED, read);
  }, []);

  useEffect(() => {
    const canvas = display.current;
    if (!name || !canvas) return;

    const less = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (less.matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const stage: Stage = { display: canvas, context, width: 0, height: 0 };
    const motor = ENGINES[name]!();

    const measure = () => {
      /*
        A escala é limitada em 2. Num monitor de retina alto o canvas de
        tela cheia passaria de dez milhões de pixels por quadro, e o ganho
        visual de faísca de 1,6px não paga esse preço.
      */
      const scale = Math.min(window.devicePixelRatio || 1, 2);

      stage.width = window.innerWidth;
      stage.height = window.innerHeight;
      canvas.width = Math.round(stage.width * scale);
      canvas.height = Math.round(stage.height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      motor.resized?.(stage);
    };

    measure();
    window.addEventListener("resize", measure);

    let request = 0;
    let anterior = performance.now();

    const run = (now: number) => {
      const step = Math.min((now - anterior) / 1000, STEP_MAX);
      anterior = now;

      motor.frame(stage, step);
      request = requestAnimationFrame(run);
    };

    /*
      Aba escondida não desenha. Sem isso o navegador segura os quadros mas
      o relógio continua, e ao voltar o primeiro passo seria enorme — as
      faíscas dariam um salto na tela.
    */
    const visibility = () => {
      cancelAnimationFrame(request);

      if (document.hidden) return;

      anterior = performance.now();
      request = requestAnimationFrame(run);
    };

    document.addEventListener("visibilitychange", visibility);
    request = requestAnimationFrame(run);

    return () => {
      cancelAnimationFrame(request);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [name]);

  if (!name) return null;

  return (
    <canvas
      data-gc="tema.fundo-do-tema.canvas"
      ref={display}
      aria-hidden
      className={
        layer === "frente"
          ? "pointer-events-none fixed inset-0 z-[9990] size-full"
          : "pointer-events-none fixed inset-0 -z-10 size-full"
      }
    />
  );
};
