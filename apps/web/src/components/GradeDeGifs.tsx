import React, { useEffect, useState } from "react";
import { Loader2, Search, TrendingUp } from "lucide-react";

import { useGifConfig, useSearchGifs, useTrendingGifs } from "~/@core/application/queries/gif/use-gifs";
import type { GifModel } from "~/@core/application/requests/gif/gifs";

export const GradeDeGifs: React.FC<{ busca: string; onGif: (gif: GifModel) => void }> = ({
  busca,
  onGif,
}) => {
  const { data: config } = useGifConfig(true);
  const [termo, setTermo] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setTermo(busca), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  const emAlta = useTrendingGifs(Boolean(config?.disponivel) && !termo.trim());
  const busca_ = useSearchGifs(config?.disponivel ? termo : "");

  if (config && !config.disponivel) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-sm font-medium">A busca de GIF precisa de uma chave</p>
        <p className="mt-2 text-xs text-ink-muted">
          Crie uma chave gratuita em{" "}
          <code className="rounded bg-surface-0 px-1">partner.klipy.com</code> e coloque em{" "}
          <code className="rounded bg-surface-0 px-1">KLIPY_API_KEY</code> no .env do projeto. Colar
          link de GIF continua funcionando sem isso.
        </p>
      </div>
    );
  }

  const lista = termo.trim() ? busca_.data : emAlta.data;
  const carregando = termo.trim() ? busca_.isLoading : emAlta.isLoading;

  return (
    <>
      <p className="mb-2 flex items-center gap-1.5 text-11 font-semibold uppercase tracking-wide text-ink-faint">
        {termo.trim() ? <Search size={12} /> : <TrendingUp size={12} />}
        {termo.trim() ? `Resultados para "${termo}"` : "GIFs em alta"}
      </p>

      {carregando && (
        <div className="flex justify-center py-10 text-ink-faint">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      <div className="columns-2 gap-2 sm:columns-3">
        {(lista ?? []).map((gif) => (
          <button
            key={gif.id}
            onClick={() => onGif(gif)}
            title={gif.descricao}
            className="group mb-2 block w-full overflow-hidden rounded-lg ring-brand/70 transition hover:ring-2 focus-visible:ring-2"
          >
            <img
              src={gif.preview}
              alt={gif.descricao}
              loading="lazy"
              className="w-full transition duration-200 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {!carregando && !(lista ?? []).length && (
        <p className="py-10 text-center text-sm text-ink-faint">Nada por aqui.</p>
      )}
    </>
  );
};
