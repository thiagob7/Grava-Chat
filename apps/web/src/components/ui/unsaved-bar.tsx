import React from "react";

import { Button } from "~/components/ui/button";

interface UnsavedBarProps {
  /** nada de barra quando não há o que salvar */
  visivel: boolean;
  salvando?: boolean;
  onDescartar: () => void;
  onSalvar: () => void;
  texto?: string;
}

/**
 * A barra de "você tem alterações não salvas".
 *
 * Estava duplicada literal no editor de perfil e no de cargos. Com a terceira
 * cópia — o editor de enfeites — viraria dívida de verdade: o dia em que o
 * texto ou o comportamento do "Descartar" mudar, alguém conserta duas das três.
 */
export const UnsavedBar: React.FC<UnsavedBarProps> = ({
  visivel,
  salvando = false,
  onDescartar,
  onSalvar,
  texto = "Você tem alterações não salvas.",
}) => {
  if (!visivel) return null;

  return (
    <footer className="sticky bottom-0 mt-6 flex items-center gap-3 rounded bg-surface-0 px-4 py-3">
      <p className="flex-1 text-sm">{texto}</p>
      <Button variant="ghost" size="sm" onClick={onDescartar}>
        Descartar
      </Button>
      <Button variant="success" size="sm" disabled={salvando} onClick={onSalvar}>
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </footer>
  );
};
