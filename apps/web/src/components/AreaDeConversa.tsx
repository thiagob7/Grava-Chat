import React, { useEffect, useRef } from "react";

/**
 * A conversa e a caixa de escrever, uma por cima da outra.
 *
 * O arranjo em coluna — lista, indicador, caixa — parava a lista ACIMA da
 * caixa, e o resultado era uma faixa morta entre as duas: a última mensagem
 * cortada reto no meio, com um vão até o campo. No Discord a conversa entra
 * por baixo da caixa; ela é uma tampa opaca, e o texto desliza para dentro
 * dela até sumir.
 *
 * Aqui a caixa sai do fluxo e vira essa tampa. Para a última mensagem não
 * ficar escondida embaixo dela, a lista ganha um recuo do tamanho exato do
 * rodapé — medido, porque ele muda: cresce com anexo, com a barra de resposta
 * e com cada linha nova que você digita.
 */
export const AreaDeConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
);

export const RodapeDaConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const rodape = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = rodape.current;
    const area = alvo?.parentElement;
    if (!alvo || !area || typeof ResizeObserver === "undefined") return;

    const observador = new ResizeObserver(() => {
      area.style.setProperty("--gc-rodape", `${Math.round(alvo.offsetHeight)}px`);
    });

    observador.observe(alvo);
    return () => {
      observador.disconnect();
      area.style.removeProperty("--gc-rodape");
    };
  }, []);

  return (
    <div ref={rodape} className="absolute inset-x-0 bottom-0 z-10 bg-surface-2">
      {children}
    </div>
  );
};
