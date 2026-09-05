import React, { useEffect, useRef, useState } from "react";

import { TEMA_APLICADO } from "~/features/configuracoes/lib/evento-de-tema";
import { cn } from "~/lib/utils";

type Borda = "esquerda" | "direita";

interface Opcoes {
  padrao: number;
  min: number;
  max: number;
  borda: Borda;
  /// Token que dá a largura de partida, para um tema poder mudá-la.
  token?: string;
}

const chaveDe = (nome: string) => `gravae:largura:${nome}`;

/*
  O token vem em rem, e daqui para baixo tudo é px. Em vez de converter na
  unha — o que amarraria o cálculo ao tamanho de fonte da raiz — deixamos o
  próprio navegador resolver: um elemento com essa largura, medido e jogado
  fora.
*/
function medir(token: string | undefined, padrao: number) {
  if (!token) return padrao;

  try {
    const regua = document.createElement("div");
    regua.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;width:var(${token})`;
    document.body.appendChild(regua);

    const medida = regua.getBoundingClientRect().width;
    regua.remove();

    return medida > 0 ? medida : padrao;
  } catch {
    return padrao;
  }
}

function guardada(nome: string) {
  try {
    const salvo = Number(localStorage.getItem(chaveDe(nome)));
    return Number.isFinite(salvo) && salvo > 0 ? salvo : null;
  } catch {
    return null;
  }
}

export function useLarguraAjustavel(nome: string, { padrao, min, max, borda, token }: Opcoes) {
  /*
    O tema também abre a gaveta: se ele pede uma lateral mais larga que o
    nosso teto, o teto sobe junto — senão a largura pedida seria aparada em
    silêncio, e ninguém entenderia por que o tema não pegou.
  */
  const [pedida, setPedida] = useState(() => medir(token, padrao));

  const piso = Math.min(min, pedida);
  const teto = Math.max(max, pedida);
  const limitar = (valor: number) => Math.min(teto, Math.max(piso, valor));

  const [largura, setLargura] = useState(() => guardada(nome) ?? pedida);
  const [arrastando, setArrastando] = useState(false);
  const inicio = useRef<{ x: number; largura: number } | null>(null);

  /*
    Quem já arrastou fica com a largura que escolheu — a pessoa mandou, e um
    tema não desfaz isso. Para quem nunca mexeu, o tema manda.
  */
  useEffect(() => {
    if (!token) return;

    const refazer = () => {
      const alvo = medir(token, padrao);
      setPedida(alvo);

      if (guardada(nome) === null) setLargura(alvo);
    };

    refazer();
    window.addEventListener(TEMA_APLICADO, refazer);

    return () => window.removeEventListener(TEMA_APLICADO, refazer);
  }, [nome, token, padrao]);

  /*
    Depois de arrastar, o token passa a contar a largura de verdade.

    Um tema faz conta com ele — a faixa do usuário lá embaixo, por exemplo, é
    "trilho mais lateral". Se o token continuasse dizendo o valor de fábrica, a
    conta daria um número fixo e a faixa ficaria mais curta que a lateral assim
    que alguém arrastasse.

    Só depois de arrastar: enquanto ninguém mexeu, quem manda no token é o tema,
    e escrever por cima o calaria.
  */
  useEffect(() => {
    if (!token || guardada(nome) === null) return;

    const raiz = document.documentElement;
    raiz.style.setProperty(token, `${Math.round(largura)}px`);

    return () => {
      raiz.style.removeProperty(token);
    };
  }, [nome, token, largura]);

  const guardar = (valor: number) => {
    try {
      localStorage.setItem(chaveDe(nome), String(valor));
    } catch {
    }
  };

  const props = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      inicio.current = { x: e.clientX, largura };
      setArrastando(true);
    },

    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inicio.current) return;

      const delta = e.clientX - inicio.current.x;
      setLargura(limitar(inicio.current.largura + (borda === "direita" ? delta : -delta)));
    },

    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inicio.current) return;

      e.currentTarget.releasePointerCapture(e.pointerId);
      inicio.current = null;
      setArrastando(false);
      guardar(largura);
    },

    onDoubleClick: () => {
      setLargura(padrao);
      guardar(padrao);
    },

    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      const passo = e.key === "ArrowLeft" ? -16 : e.key === "ArrowRight" ? 16 : 0;
      if (!passo) return;

      e.preventDefault();
      const nova = limitar(largura + (borda === "direita" ? passo : -passo));
      setLargura(nova);
      guardar(nova);
    },
  };

  return { largura, arrastando, alca: props, limites: { min: piso, max: teto } };
}

export const AlcaDeLargura: React.FC<
  {
    borda: Borda;
    arrastando: boolean;
    largura: number;
    limites: { min: number; max: number };
  } & React.ComponentProps<"div">
> = ({ borda, arrastando, largura, limites, className, ...props }) => (
  <div data-gc="ui.resizable.div"
    role="separator"
    aria-orientation="vertical"
    aria-label="Ajustar a largura"
    aria-valuenow={Math.round(largura)}
    aria-valuemin={limites.min}
    aria-valuemax={limites.max}
    tabIndex={0}
    className={cn(
      "group/alca absolute inset-y-0 z-20 w-2 cursor-col-resize",
      borda === "direita" ? "-right-1" : "-left-1",
      className,
    )}
    {...props}
  >
    <span data-gc="ui.resizable.span"
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-150",
        arrastando
          ? "w-0.5 bg-brand"
          : "w-px bg-transparent group-hover/alca:w-0.5 group-hover/alca:bg-ink-faint group-focus-visible/alca:w-0.5 group-focus-visible/alca:bg-brand",
      )}
    />
  </div>
);
