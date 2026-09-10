import React, { useEffect, useRef, useState } from "react";

import { TEMA_APLICADO } from "~/features/configuracoes/lib/evento-de-tema";
import {
  MOTORES,
  camadaPedidaPeloTema,
  motorPedidoPeloTema,
  type Palco,
} from "~/features/tema/lib/fundos";

const PASSO_MAXIMO = 1 / 20;

/*
  A tela onde os motores de fundo desenham. Fica atrás do app inteiro e só
  existe quando o tema aplicado pede um pelo nome.

  Nada aqui responde ao mouse: `pointer-events: none` porque uma camada em
  cima da tela toda comeria o clique do app. Quem quiser clicar para soltar
  um foguete perde o app inteiro, e não vale a troca.
*/
export const FundoDoTema: React.FC = () => {
  const [nome, setNome] = useState<string | null>(null);
  const [camada, setCamada] = useState<"frente" | "fundo">("fundo");
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ler = () => {
      setNome(motorPedidoPeloTema());
      setCamada(camadaPedidaPeloTema());
    };

    ler();
    window.addEventListener(TEMA_APLICADO, ler);
    return () => window.removeEventListener(TEMA_APLICADO, ler);
  }, []);

  useEffect(() => {
    const canvas = tela.current;
    if (!nome || !canvas) return;

    const menos = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (menos.matches) return;

    const contexto = canvas.getContext("2d");
    if (!contexto) return;

    const palco: Palco = { tela: canvas, contexto, largura: 0, altura: 0 };
    const motor = MOTORES[nome]!();

    const medir = () => {
      /*
        A escala é limitada em 2. Num monitor de retina alto o canvas de
        tela cheia passaria de dez milhões de pixels por quadro, e o ganho
        visual de faísca de 1,6px não paga esse preço.
      */
      const escala = Math.min(window.devicePixelRatio || 1, 2);

      palco.largura = window.innerWidth;
      palco.altura = window.innerHeight;
      canvas.width = Math.round(palco.largura * escala);
      canvas.height = Math.round(palco.altura * escala);
      contexto.setTransform(escala, 0, 0, escala, 0, 0);
      motor.redimensionou?.(palco);
    };

    medir();
    window.addEventListener("resize", medir);

    let pedido = 0;
    let anterior = performance.now();

    const rodar = (agora: number) => {
      const passo = Math.min((agora - anterior) / 1000, PASSO_MAXIMO);
      anterior = agora;

      motor.quadro(palco, passo);
      pedido = requestAnimationFrame(rodar);
    };

    /*
      Aba escondida não desenha. Sem isso o navegador segura os quadros mas
      o relógio continua, e ao voltar o primeiro passo seria enorme — as
      faíscas dariam um salto na tela.
    */
    const visibilidade = () => {
      cancelAnimationFrame(pedido);

      if (document.hidden) return;

      anterior = performance.now();
      pedido = requestAnimationFrame(rodar);
    };

    document.addEventListener("visibilitychange", visibilidade);
    pedido = requestAnimationFrame(rodar);

    return () => {
      cancelAnimationFrame(pedido);
      window.removeEventListener("resize", medir);
      document.removeEventListener("visibilitychange", visibilidade);
    };
  }, [nome]);

  if (!nome) return null;

  return (
    <canvas
      data-gc="tema.fundo-do-tema.canvas"
      ref={tela}
      aria-hidden
      className={
        camada === "frente"
          ? "pointer-events-none fixed inset-0 z-[9990] size-full"
          : "pointer-events-none fixed inset-0 -z-10 size-full"
      }
    />
  );
};
