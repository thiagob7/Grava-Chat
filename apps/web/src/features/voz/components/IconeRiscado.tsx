import type { LucideIcon } from "lucide-react";
import React from "react";

import { cn } from "~/lib/utils";

/**
 * Ícone que ganha um risco atravessado quando o recurso está desligado, em vez
 * de ser trocado por outro ícone. O risco se desenha da esquerda para a
 * direita, e uma linha na cor do fundo abre um vão para ele não encostar no
 * traço do desenho.
 *
 * A cor desse vão vem da variável `--cor-do-vao`, que quem desenha o botão
 * define. Sem ela, o vão assume o fundo da barra.
 */
export const IconeRiscado: React.FC<{
  icone: LucideIcon;
  riscado: boolean;
  /** Pinta de vermelho quando riscado. Câmera e tela não usam, microfone sim. */
  alerta?: boolean;
  size?: number;
  className?: string;
}> = ({ icone: Icone, riscado, alerta = false, size = 18, className }) => {
  const [tocado, setTocado] = React.useState(false);
  const primeiraPintura = React.useRef(true);

  // O pulinho é resposta ao clique, então não acontece quando a tela abre já
  // com o recurso desligado.
  React.useEffect(() => {
    if (primeiraPintura.current) {
      primeiraPintura.current = false;
      return;
    }
    setTocado(true);
    const relogio = setTimeout(() => setTocado(false), 200);
    return () => clearTimeout(relogio);
  }, [riscado]);

  const risco = {
    x1: 4,
    y1: 4,
    x2: 20,
    y2: 20,
    // pathLength normaliza o traço em 1, então o desenho não depende do
    // comprimento real da linha.
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: riscado ? 0 : 1,
    strokeLinecap: "round" as const,
  };

  return (
    <span
      data-gc="voz.icone-riscado.span"
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 transition-transform duration-200",
        tocado && "scale-[0.88]",
        riscado && alerta && "text-danger",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icone
        data-gc="voz.icone-riscado.icone"
        size={size}
        className="transition-colors duration-200"
      />

      <svg
        data-gc="voz.icone-riscado.svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        className="pointer-events-none absolute inset-0"
      >
        <line data-gc="voz.icone-riscado.line"
          {...risco}
          stroke="var(--cor-do-vao, var(--color-surface-0))"
          strokeWidth={5}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
        <line data-gc="voz.icone-riscado.line--2"
          {...risco}
          stroke="currentColor"
          strokeWidth={2}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
    </span>
  );
};
