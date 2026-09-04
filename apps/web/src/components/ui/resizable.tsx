import React, { useRef, useState } from "react";

import { cn } from "~/lib/utils";

type Borda = "esquerda" | "direita";

interface Opcoes {
  padrao: number;
  min: number;
  max: number;
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
  const inicio = useRef<{ x: number; largura: number } | null>(null);

  const limitar = (valor: number) => Math.min(max, Math.max(min, valor));

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

  return { largura, arrastando, alca: props, limites: { min, max } };
}

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
      "group/alca absolute inset-y-0 z-20 w-2 cursor-col-resize",
      borda === "direita" ? "-right-1" : "-left-1",
      className,
    )}
    {...props}
  >
    <span
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
