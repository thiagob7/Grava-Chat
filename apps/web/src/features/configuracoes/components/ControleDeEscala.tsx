import React from "react";

import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";

interface ScalePropsControl {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  brands: number[];
}

export const ScaleControl: React.FC<ScalePropsControl> = ({
  value,
  onChange,
  min,
  max,
  step,
  brands,
}) => (
  <div data-gc="configuracoes.controle-de-escala.div">
    <div data-gc="configuracoes.controle-de-escala.div--2" className="flex items-center gap-4">
      <Slider data-gc="configuracoes.controle-de-escala.slider"
        min={min}
        max={max}
        step={step}
        value={value}
        filled={(value - min) / (max - min)}
        defaultAt={(100 - min) / (max - min)}
        defaultLabel="100%"
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Tamanho, em porcentagem"
      />
      <span data-gc="configuracoes.controle-de-escala.span" className="w-14 shrink-0 text-right text-sm tabular-nums text-ink-muted">
        {value}%
      </span>
    </div>

    <div data-gc="configuracoes.controle-de-escala.div--3" className="mt-2 flex items-center justify-between">
      <div data-gc="configuracoes.controle-de-escala.div--4" className="flex gap-4 text-11 tabular-nums text-ink-faint">
        {brands.map((brand) => (
          <button data-gc="configuracoes.controle-de-escala.button"
            key={brand}
            type="button"
            onClick={() => onChange(brand)}
            className="rounded px-1 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foco-anel"
          >
            {brand}%
          </button>
        ))}
      </div>

      {value !== 100 && (
        <Button data-gc="configuracoes.controle-de-escala.button--2" variant="ghost" size="sm" onClick={() => onChange(100)}>
          Voltar ao padrão
        </Button>
      )}
    </div>
  </div>
);
