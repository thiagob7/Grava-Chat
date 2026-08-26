import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface CampoDeBuscaProps {
  /// o termo que está valendo agora (vazio = painel fechado)
  termo: string;
  onBuscar: (termo: string) => void;
}

/**
 * O campo de busca do cabeçalho.
 *
 * Procura no Enter, não a cada tecla: cada busca varre o histórico de todos
 * os canais que você pode ler, e disparar isso a cada letra digitada seria
 * uma dezena de varreduras para chegar na primeira palavra.
 */
export const CampoDeBusca: React.FC<CampoDeBuscaProps> = ({ termo, onBuscar }) => {
  const [rascunho, setRascunho] = useState(termo);

  /// Fechar o painel por fora (o X dele, trocar de servidor) esvazia o campo.
  useEffect(() => {
    if (!termo) setRascunho("");
  }, [termo]);

  return (
    <div className="relative hidden items-center @2xl:flex">
      <Search size={14} className="pointer-events-none absolute left-2 text-ink-faint" />

      <input
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onBuscar(rascunho.trim());
          if (e.key === "Escape") {
            setRascunho("");
            onBuscar("");
            e.currentTarget.blur();
          }
        }}
        placeholder="Buscar"
        aria-label="Buscar mensagens neste servidor"
        className="h-7 w-36 rounded bg-surface-1 pl-7 pr-6 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:w-56 focus:ring-1 focus:ring-brand"
      />

      {rascunho && (
        <button
          onClick={() => {
            setRascunho("");
            onBuscar("");
          }}
          aria-label="Limpar a busca"
          className="absolute right-1.5 text-ink-faint transition hover:text-ink"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
