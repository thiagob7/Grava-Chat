import React, { useRef, useState } from "react";

import { cn } from "~/lib/utils";

/**
 * Painéis laterais com largura arrastável, como no Discord.
 *
 * A largura fica no localStorage e não na conta: é uma questão do tamanho
 * DESTA tela. Levar isso pro servidor faria a barra encolher no notebook
 * porque você a alargou no monitor grande.
 */

type Borda = "esquerda" | "direita";

interface Opcoes {
  padrao: number;
  min: number;
  max: number;
  /** de que lado do painel fica a alça */
  borda: Borda;
}

const chaveDe = (nome: string) => `gravae:largura:${nome}`;

function ler(nome: string, padrao: number, min: number, max: number) {
  try {
    const salvo = Number(localStorage.getItem(chaveDe(nome)));
    return Number.isFinite(salvo) && salvo > 0 ? Math.min(max, Math.max(min, salvo)) : padrao;
  } catch {
    return padrao;
  }
}

export function useLarguraAjustavel(nome: string, { padrao, min, max, borda }: Opcoes) {
  const [largura, setLargura] = useState(() => ler(nome, padrao, min, max));
  const [arrastando, setArrastando] = useState(false);
  /** onde o arrasto começou; `null` quando não há arrasto em curso */
  const inicio = useRef<{ x: number; largura: number } | null>(null);

  const limitar = (valor: number) => Math.min(max, Math.max(min, valor));

  const guardar = (valor: number) => {
    try {
      localStorage.setItem(chaveDe(nome), String(valor));
    } catch {
      /* modo privado sem storage: vale só nesta sessão */
    }
  };

  const props = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      // sem isto o arrasto vira seleção de texto do painel inteiro
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      inicio.current = { x: e.clientX, largura };
      setArrastando(true);
    },

    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inicio.current) return;

      const delta = e.clientX - inicio.current.x;
      // painel à esquerda cresce pra direita; à direita, o contrário
      setLargura(limitar(inicio.current.largura + (borda === "direita" ? delta : -delta)));
    },

    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!inicio.current) return;

      e.currentTarget.releasePointerCapture(e.pointerId);
      inicio.current = null;
      setArrastando(false);
      guardar(largura);
    },

    /** Volta ao tamanho de fábrica — o jeito de sair de um arrasto infeliz. */
    onDoubleClick: () => {
      setLargura(padrao);
      guardar(padrao);
    },

    /** Teclado: a alça é focável, então tem que dar pra ajustar sem o mouse. */
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      const passo = e.key === "ArrowLeft" ? -16 : e.key === "ArrowRight" ? 16 : 0;
      if (!passo) return;

      e.preventDefault();
      const nova = limitar(largura + (borda === "direita" ? passo : -passo));
      setLargura(nova);
      guardar(nova);
    },
  };

  return { largura, arrastando, alca: props, limites: { min, max } };
}

/**
 * A alça em si: uma faixa fina na borda do painel. Fica absoluta pra não
 * empurrar o conteúdo, e transborda meio pixel pra cada lado — uma linha de 1px
 * é impossível de acertar com o mouse.
 */
export const AlcaDeLargura: React.FC<
  {
    borda: Borda;
    arrastando: boolean;
    largura: number;
    limites: { min: number; max: number };
  } & React.ComponentProps<"div">
> = ({ borda, arrastando, largura, limites, className, ...props }) => (
  <div
    role="separator"
    aria-orientation="vertical"
    aria-label="Ajustar a largura"
    aria-valuenow={Math.round(largura)}
    aria-valuemin={limites.min}
    aria-valuemax={limites.max}
    tabIndex={0}
    className={cn(
      "absolute inset-y-0 z-20 w-1 cursor-col-resize transition-colors",
      borda === "direita" ? "-right-0.5" : "-left-0.5",
      arrastando ? "bg-brand" : "hover:bg-brand/70 focus-visible:bg-brand/70",
      className,
    )}
    {...props}
  />
);
