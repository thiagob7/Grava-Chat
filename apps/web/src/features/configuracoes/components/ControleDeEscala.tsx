import React from "react";

import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";

interface ControleDeEscalaProps {
  valor: number;
  onMudar: (valor: number) => void;
  min: number;
  max: number;
  passo: number;
  marcas: number[];
}

export const ControleDeEscala: React.FC<ControleDeEscalaProps> = ({
  valor,
  onMudar,
  min,
  max,
  passo,
  marcas,
}) => (
  <div data-gc="configuracoes.controle-de-escala.div">
    <div data-gc="configuracoes.controle-de-escala.div--2" className="flex items-center gap-4">
      <Slider data-gc="configuracoes.controle-de-escala.slider"
        min={min}
        max={max}
        step={passo}
        value={valor}
        preenchido={(valor - min) / (max - min)}
        onChange={(e) => onMudar(Number(e.target.value))}
        aria-label="Tamanho, em porcentagem"
      />
      <span data-gc="configuracoes.controle-de-escala.span" className="w-14 shrink-0 text-right text-sm tabular-nums text-ink-muted">
        {valor}%
      </span>
    </div>

    <div data-gc="configuracoes.controle-de-escala.div--3" className="mt-2 flex items-center justify-between">
      <div data-gc="configuracoes.controle-de-escala.div--4" className="flex gap-4 text-11 tabular-nums text-ink-faint">
        {marcas.map((marca) => (
          <button data-gc="configuracoes.controle-de-escala.button"
            key={marca}
            type="button"
            onClick={() => onMudar(marca)}
            className="rounded px-1 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            {marca}%
          </button>
        ))}
      </div>

      {valor !== 100 && (
        <Button data-gc="configuracoes.controle-de-escala.button--2" variant="ghost" size="sm" onClick={() => onMudar(100)}>
          Voltar ao padrão
        </Button>
      )}
    </div>
  </div>
);
