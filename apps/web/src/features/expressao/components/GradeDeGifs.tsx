import React, { useEffect, useState } from "react";
import { Loader2, Search, TrendingUp } from "lucide-react";

import { useGifConfig, useSearchGifs, useTrendingGifs } from "~/@core/application/queries/gif/use-gifs";
import type { GifModel } from "~/@core/application/requests/gif/gifs";

export const GifsGrid: React.FC<{ search: string; onGif: (gif: GifModel) => void }> = ({
  search,
  onGif,
}) => {
  const { data: config } = useGifConfig(true);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setTerm(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const inHigh = useTrendingGifs(Boolean(config?.available) && !term.trim());
  const search_ = useSearchGifs(config?.available ? term : "");

  if (config && !config.available) {
    return (
      <div data-gc="expressao.grade-de-gifs.div" className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
        <p data-gc="expressao.grade-de-gifs.p" className="text-sm font-medium">A busca de GIF precisa de uma chave</p>
        <p data-gc="expressao.grade-de-gifs.p--2" className="mt-2 text-xs text-ink-muted">
          Crie uma chave gratuita em{" "}
          <code data-gc="expressao.grade-de-gifs.code" className="rounded bg-surface-0 px-1">partner.klipy.com</code> e coloque em{" "}
          <code data-gc="expressao.grade-de-gifs.code--2" className="rounded bg-surface-0 px-1">KLIPY_API_KEY</code> no .env do projeto. Colar
          link de GIF continua funcionando sem isso.
        </p>
      </div>
    );
  }

  const list = term.trim() ? search_.data : inHigh.data;
  const loading = term.trim() ? search_.isLoading : inHigh.isLoading;

  return (
    <>
      <p data-gc="expressao.grade-de-gifs.p--3" className="mb-2 flex items-center gap-1.5 text-11 font-semibold uppercase tracking-wide text-ink-faint">
        {term.trim() ? <Search data-gc="expressao.grade-de-gifs.search" size={12} /> : <TrendingUp data-gc="expressao.grade-de-gifs.trending-up" size={12} />}
        {term.trim() ? `Resultados para "${term}"` : "GIFs em alta"}
      </p>

      {loading && (
        <div data-gc="expressao.grade-de-gifs.div--2" className="flex justify-center py-10 text-ink-faint">
          <Loader2 data-gc="expressao.grade-de-gifs.loader2" size={20} className="animate-spin" />
        </div>
      )}

      <div data-gc="expressao.grade-de-gifs.div--3" className="columns-2 gap-2 sm:columns-3">
        {(list ?? []).map((gif) => (
          <button data-gc="expressao.grade-de-gifs.button"
            key={gif.id}
            onClick={() => onGif(gif)}
            title={gif.description}
            className="group mb-2 block w-full overflow-hidden rounded-lg ring-brand/70 transition hover:ring-2 focus-visible:ring-2"
          >
            <img data-gc="expressao.grade-de-gifs.img"
              src={gif.preview}
              alt={gif.description}
              loading="lazy"
              className="w-full transition duration-200 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {!loading && !(list ?? []).length && (
        <p data-gc="expressao.grade-de-gifs.p--4" className="py-10 text-center text-sm text-ink-faint">Nada por aqui.</p>
      )}
    </>
  );
};
