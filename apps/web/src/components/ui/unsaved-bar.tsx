import React from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface UnsavedBarProps {
  /** nada de barra quando não há o que salvar */
  visivel: boolean;
  salvando?: boolean;
  onDescartar: () => void;
  onSalvar: () => void;
  texto?: string;
  /**
   * Flutuando no rodapé da JANELA, e não grudada no fim da coluna.
   *
   * Serve pra tela larga em que a coluna é estreita: presa dentro dela, a frase
   * quebrava em três linhas e a barra virava um bloco. Solta no rodapé ela tem a
   * largura que precisa — e continua sendo a mesma barra, com o mesmo
   * comportamento, em todos os outros lugares.
   */
  flutuante?: boolean;
  acaoDescartar?: string;
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
  flutuante = false,
  acaoDescartar = "Descartar",
}) => {
  if (!visivel) return null;

  return (
    <footer
      className={cn(
        "flex items-center gap-3 rounded-lg bg-surface-0 px-4 py-3",
        flutuante
          ? /**
             * `pointer-events-auto` NÃO é detalhe: enquanto um diálogo do Radix
             * está aberto, ele desliga o ponteiro em tudo que está fora do
             * conteúdo dele. Como esta barra é irmã do conteúdo (precisa ser,
             * pra o `fixed` valer contra a janela), sem isto ela aparece
             * bonitinha e os botões não clicam — foi assim que o Salvar do
             * editor de perfil ficou morto sem nenhum erro no console.
             */
            "pointer-events-auto fixed bottom-6 left-1/2 z-[60] w-[min(560px,92vw)] -translate-x-1/2 shadow-2xl ring-1 ring-line"
          : "sticky bottom-0 mt-6",
      )}
    >
      <p className="flex-1 text-sm">{texto}</p>
      <Button variant="ghost" size="sm" onClick={onDescartar}>
        {acaoDescartar}
      </Button>
      <Button
        variant="success"
        size="sm"
        disabled={salvando}
        onClick={onSalvar}
      >
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </footer>
  );
};
