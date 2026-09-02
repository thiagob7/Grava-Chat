import React from "react";

import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";

interface ControleDeEscalaProps {
  valor: number;
  onMudar: (valor: number) => void;
  min: number;
  max: number;
  passo: number;
  /// os valores que ganham marca embaixo da régua
  marcas: number[];
}

/*
  Uma régua de porcentagem com marcas e um botão de voltar ao padrão.

  O botão não é enfeite: quem arrasta a régua até uma tela ilegível não
  consegue mais ler o próprio controle pra desfazer. Ele fica sempre no mesmo
  lugar e sempre com o mesmo alvo, e é a saída de emergência.
*/
export const ControleDeEscala: React.FC<ControleDeEscalaProps> = ({
  valor,
  onMudar,
  min,
  max,
  passo,
  marcas,
}) => (
  <div>
    <div className="flex items-center gap-4">
      <Slider
        min={min}
        max={max}
        step={passo}
        value={valor}
        preenchido={(valor - min) / (max - min)}
        onChange={(e) => onMudar(Number(e.target.value))}
        aria-label="Tamanho, em porcentagem"
      />
      <span className="w-14 shrink-0 text-right text-sm tabular-nums text-ink-muted">
        {valor}%
      </span>
    </div>

    <div className="mt-2 flex items-center justify-between">
      <div className="flex gap-4 text-[11px] tabular-nums text-ink-faint">
        {marcas.map((marca) => (
          <button
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
        <Button variant="ghost" size="sm" onClick={() => onMudar(100)}>
          Voltar ao padrão
        </Button>
      )}
    </div>
  </div>
);
