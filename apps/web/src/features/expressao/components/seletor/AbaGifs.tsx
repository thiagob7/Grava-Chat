import React, { useEffect, useState } from "react";
import { ChevronLeft, Star, TrendingUp } from "lucide-react";

import {
  useFavoriteGifs,
  useGifCategories,
  useGifConfig,
  useSearchGifs,
  useToggleFavoriteGif,
  useTrendingGifs,
} from "~/@core/application/queries/gif/use-gifs";
import type { GifModelCategory, GifModel } from "~/@core/application/requests/gif/gifs";
import { Loading, Empty } from "~/features/expressao/components/seletor/pecas";
import { cn } from "~/lib/utils";

type Section = { kind: "favoritos" } | { kind: "alta" } | { kind: "termo"; term: string } | null;

export const TabGifs: React.FC<{
  search: string;
  onGif: (gif: GifModel) => void;
  onSearch: (term: string) => void;
}> = ({ search, onGif, onSearch }) => {
  const { data: config } = useGifConfig(true);
  const available = Boolean(config?.available);

  const [section, setSection] = useState<Section>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setTyped(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (typed) setSection({ kind: "termo", term: typed });
    else if (search.trim() === "") setSection((current) => (current?.kind === "termo" ? null : current));
  }, [typed, search]);

  const favorites = useFavoriteGifs(available);
  const high = useTrendingGifs(available && section?.kind === "alta");
  const result = useSearchGifs(section?.kind === "termo" ? section.term : "");

  if (config && !available) return <WithoutKey data-gc="expressao.seletor.aba-gifs.without-key" />;

  if (!section) {
    return (
      <Cover data-gc="expressao.seletor.aba-gifs.cover"
        favorites={favorites.data ?? []}
        onOpen={(fresh) => {
          if (fresh.kind === "termo") onSearch(fresh.term);
          setSection(fresh);
        }}
      />
    );
  }

  const list =
    section.kind === "favoritos" ? favorites.data : section.kind === "alta" ? high.data : result.data;

  const loading =
    section.kind === "favoritos"
      ? favorites.isLoading
      : section.kind === "alta"
        ? high.isLoading
        : result.isLoading;

  const title =
    section.kind === "favoritos" ? "Favoritos" : section.kind === "alta" ? "GIFs em alta" : section.term;

  const back = () => {
    setSection(null);
    onSearch("");
  };

  return (
    <div data-gc="expressao.seletor.aba-gifs.div" className="flex min-h-0 flex-1 flex-col px-3 pb-3">
      <button data-gc="expressao.seletor.aba-gifs.button.back"
        onClick={back}
        className="mb-2 flex shrink-0 items-center gap-1 self-start rounded py-1 pr-2 text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronLeft data-gc="expressao.seletor.aba-gifs.chevron-left" size={14} />
        <span data-gc="expressao.seletor.aba-gifs.span" className="truncate">{title}</span>
      </button>

      <div data-gc="expressao.seletor.aba-gifs.div--2" className="min-h-0 flex-1 overflow-y-auto">
        {loading && <Loading data-gc="expressao.seletor.aba-gifs.loading" />}

        {!loading && !(list ?? []).length && (
          <Empty data-gc="expressao.seletor.aba-gifs.empty">
            {section.kind === "favoritos"
              ? "Você ainda não guardou nenhum GIF. Passe o mouse num GIF e clique na estrela."
              : "Nada por aqui."}
          </Empty>
        )}

        <Grid data-gc="expressao.seletor.aba-gifs.grid.on-gif" gifs={list ?? []} favorites={favorites.data ?? []} onGif={onGif} />
      </div>
    </div>
  );
};

const Card: React.FC<{
  name: string;
  preview?: string;
  icon?: React.ReactNode;
  seal?: number;
  onClick: () => void;
}> = ({ name, preview, icon, seal, onClick }) => (
  <button data-gc="expressao.seletor.aba-gifs.button.on-click"
    onClick={onClick}
    className="group relative h-[86px] overflow-hidden rounded-lg ring-line-sutil transition hover:ring-2"
  >
    {preview ? (
      <img data-gc="expressao.seletor.aba-gifs.img"
        src={preview}
        alt=""
        loading="lazy"
        className="size-full object-cover transition duration-200 group-hover:scale-105"
      />
    ) : (
      <span data-gc="expressao.seletor.aba-gifs.span--2" className="block size-full bg-gradient-to-br from-brand/70 to-brand-hover" />
    )}

    <span data-gc="expressao.seletor.aba-gifs.span--3" className="absolute inset-0 flex items-center justify-center gap-1.5 bg-sobre-midia px-2 text-center text-sm font-bold text-palco-ink drop-shadow transition group-hover:bg-sobre-midia">
      {icon}
      {name}
    </span>

    {seal !== undefined && seal > 0 && (
      <span data-gc="expressao.seletor.aba-gifs.span--4" className="absolute right-1.5 top-1.5 rounded-full bg-sobre-midia px-1.5 py-0.5 text-10 font-semibold text-palco-ink">
        {seal}
      </span>
    )}
  </button>
);

const Cover: React.FC<{
  favorites: GifModel[];
  onOpen: (section: NonNullable<Section>) => void;
}> = ({ favorites, onOpen }) => {
  const { data: categories, isLoading } = useGifCategories(true);
  const { data: high } = useTrendingGifs(true);

  return (
    <div data-gc="expressao.seletor.aba-gifs.div--3" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      <div data-gc="expressao.seletor.aba-gifs.div--4" className="grid grid-cols-2 gap-2">
        <Card data-gc="expressao.seletor.aba-gifs.card"
          name="Favoritos"
          preview={favorites[0]?.preview}
          seal={favorites.length}
          icon={<Star data-gc="expressao.seletor.aba-gifs.star" size={14} className="fill-current" />}
          onClick={() => onOpen({ kind: "favoritos" })}
        />

        <Card data-gc="expressao.seletor.aba-gifs.card--2"
          name="GIFs em alta"
          preview={high?.[0]?.preview}
          icon={<TrendingUp data-gc="expressao.seletor.aba-gifs.trending-up" size={14} />}
          onClick={() => onOpen({ kind: "alta" })}
        />

        {(categories ?? []).map((cat: GifModelCategory) => (
          <Card data-gc="expressao.seletor.aba-gifs.card--3"
            key={cat.term}
            name={cat.name}
            preview={cat.preview}
            onClick={() => onOpen({ kind: "termo", term: cat.term })}
          />
        ))}
      </div>

      {isLoading && <Loading data-gc="expressao.seletor.aba-gifs.loading--2" />}
    </div>
  );
};

const Grid: React.FC<{
  gifs: GifModel[];
  favorites: GifModel[];
  onGif: (gif: GifModel) => void;
}> = ({ gifs, favorites, onGif }) => {
  const toggle = useToggleFavoriteGif();
  const savedItems = new Set(favorites.map((f) => f.id));

  return (
    <div data-gc="expressao.seletor.aba-gifs.div--5" className="columns-2 gap-2">
      {gifs.map((gif) => {
        const saved = savedItems.has(gif.id);

        return (
          <div data-gc="expressao.seletor.aba-gifs.div--6" key={gif.id} className="group relative mb-2 break-inside-avoid">
            <button data-gc="expressao.seletor.aba-gifs.button"
              onClick={() => onGif(gif)}
              title={gif.description}
              className="block w-full overflow-hidden rounded-lg ring-brand/70 transition hover:ring-2 focus-visible:ring-2"
            >
              <img data-gc="expressao.seletor.aba-gifs.img--2"
                src={gif.preview}
                alt={gif.description}
                loading="lazy"
                className="w-full transition duration-200 group-hover:scale-[1.03]"
              />
            </button>

            <button data-gc="expressao.seletor.aba-gifs.button--2"
              onClick={() => toggle.mutate({ gif, saved })}
              aria-label={saved ? "Tirar dos favoritos" : "Guardar nos favoritos"}
              title={saved ? "Tirar dos favoritos" : "Guardar nos favoritos"}
              className={cn(
                "absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-sobre-midia backdrop-blur transition",
                "hover:bg-sobre-midia focus-visible:opacity-100",
                saved ? "text-brand opacity-100" : "text-palco-ink opacity-0 group-hover:opacity-100",
              )}
            >
              <Star data-gc="expressao.seletor.aba-gifs.star--2" size={14} className={saved ? "fill-current" : undefined} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const WithoutKey: React.FC = () => (
  <div data-gc="expressao.seletor.aba-gifs.div--7" className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
    <p data-gc="expressao.seletor.aba-gifs.p" className="text-sm font-medium">A busca de GIF precisa de uma chave</p>
    <p data-gc="expressao.seletor.aba-gifs.p--2" className="mt-2 text-xs text-ink-muted">
      Crie uma chave gratuita em{" "}
      <code data-gc="expressao.seletor.aba-gifs.code" className="rounded bg-surface-0 px-1">partner.klipy.com</code> e coloque em{" "}
      <code data-gc="expressao.seletor.aba-gifs.code--2" className="rounded bg-surface-0 px-1">KLIPY_API_KEY</code> no .env do projeto. Colar
      link de GIF continua funcionando sem isso.
    </p>
  </div>
);
