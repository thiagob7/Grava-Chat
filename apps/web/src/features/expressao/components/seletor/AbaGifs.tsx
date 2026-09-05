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
import type { CategoriaDeGifModel, GifModel } from "~/@core/application/requests/gif/gifs";
import { Carregando, Vazio } from "~/features/expressao/components/seletor/pecas";
import { cn } from "~/lib/utils";

type Secao = { tipo: "favoritos" } | { tipo: "alta" } | { tipo: "termo"; termo: string } | null;

export const AbaGifs: React.FC<{
  busca: string;
  onGif: (gif: GifModel) => void;
  onBusca: (termo: string) => void;
}> = ({ busca, onGif, onBusca }) => {
  const { data: config } = useGifConfig(true);
  const disponivel = Boolean(config?.disponivel);

  const [secao, setSecao] = useState<Secao>(null);
  const [digitado, setDigitado] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDigitado(busca.trim()), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (digitado) setSecao({ tipo: "termo", termo: digitado });
    else if (busca.trim() === "") setSecao((atual) => (atual?.tipo === "termo" ? null : atual));
  }, [digitado, busca]);

  const favoritos = useFavoriteGifs(disponivel);
  const alta = useTrendingGifs(disponivel && secao?.tipo === "alta");
  const resultado = useSearchGifs(secao?.tipo === "termo" ? secao.termo : "");

  if (config && !disponivel) return <SemChave data-gc="expressao.seletor.aba-gifs.sem-chave" />;

  if (!secao) {
    return (
      <Capa data-gc="expressao.seletor.aba-gifs.capa"
        favoritos={favoritos.data ?? []}
        onAbrir={(nova) => {
          if (nova.tipo === "termo") onBusca(nova.termo);
          setSecao(nova);
        }}
      />
    );
  }

  const lista =
    secao.tipo === "favoritos" ? favoritos.data : secao.tipo === "alta" ? alta.data : resultado.data;

  const carregando =
    secao.tipo === "favoritos"
      ? favoritos.isLoading
      : secao.tipo === "alta"
        ? alta.isLoading
        : resultado.isLoading;

  const titulo =
    secao.tipo === "favoritos" ? "Favoritos" : secao.tipo === "alta" ? "GIFs em alta" : secao.termo;

  const voltar = () => {
    setSecao(null);
    onBusca("");
  };

  return (
    <div data-gc="expressao.seletor.aba-gifs.div" className="flex min-h-0 flex-1 flex-col px-3 pb-3">
      <button data-gc="expressao.seletor.aba-gifs.button.voltar"
        onClick={voltar}
        className="mb-2 flex shrink-0 items-center gap-1 self-start rounded py-1 pr-2 text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronLeft data-gc="expressao.seletor.aba-gifs.chevron-left" size={14} />
        <span data-gc="expressao.seletor.aba-gifs.span" className="truncate">{titulo}</span>
      </button>

      <div data-gc="expressao.seletor.aba-gifs.div--2" className="min-h-0 flex-1 overflow-y-auto">
        {carregando && <Carregando data-gc="expressao.seletor.aba-gifs.carregando" />}

        {!carregando && !(lista ?? []).length && (
          <Vazio data-gc="expressao.seletor.aba-gifs.vazio">
            {secao.tipo === "favoritos"
              ? "Você ainda não guardou nenhum GIF. Passe o mouse num GIF e clique na estrela."
              : "Nada por aqui."}
          </Vazio>
        )}

        <Grade data-gc="expressao.seletor.aba-gifs.grade.on-gif" gifs={lista ?? []} favoritos={favoritos.data ?? []} onGif={onGif} />
      </div>
    </div>
  );
};

const Cartao: React.FC<{
  nome: string;
  preview?: string;
  icone?: React.ReactNode;
  selo?: number;
  onClick: () => void;
}> = ({ nome, preview, icone, selo, onClick }) => (
  <button data-gc="expressao.seletor.aba-gifs.button.on-click"
    onClick={onClick}
    className="group relative h-[86px] overflow-hidden rounded-lg ring-white/70 transition hover:ring-2"
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

    <span data-gc="expressao.seletor.aba-gifs.span--3" className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 px-2 text-center text-sm font-bold text-white drop-shadow transition group-hover:bg-black/25">
      {icone}
      {nome}
    </span>

    {selo !== undefined && selo > 0 && (
      <span data-gc="expressao.seletor.aba-gifs.span--4" className="absolute right-1.5 top-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-10 font-semibold text-white">
        {selo}
      </span>
    )}
  </button>
);

const Capa: React.FC<{
  favoritos: GifModel[];
  onAbrir: (secao: NonNullable<Secao>) => void;
}> = ({ favoritos, onAbrir }) => {
  const { data: categorias, isLoading } = useGifCategories(true);
  const { data: alta } = useTrendingGifs(true);

  return (
    <div data-gc="expressao.seletor.aba-gifs.div--3" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      <div data-gc="expressao.seletor.aba-gifs.div--4" className="grid grid-cols-2 gap-2">
        <Cartao data-gc="expressao.seletor.aba-gifs.cartao"
          nome="Favoritos"
          preview={favoritos[0]?.preview}
          selo={favoritos.length}
          icone={<Star data-gc="expressao.seletor.aba-gifs.star" size={14} className="fill-current" />}
          onClick={() => onAbrir({ tipo: "favoritos" })}
        />

        <Cartao data-gc="expressao.seletor.aba-gifs.cartao--2"
          nome="GIFs em alta"
          preview={alta?.[0]?.preview}
          icone={<TrendingUp data-gc="expressao.seletor.aba-gifs.trending-up" size={14} />}
          onClick={() => onAbrir({ tipo: "alta" })}
        />

        {(categorias ?? []).map((cat: CategoriaDeGifModel) => (
          <Cartao data-gc="expressao.seletor.aba-gifs.cartao--3"
            key={cat.termo}
            nome={cat.nome}
            preview={cat.preview}
            onClick={() => onAbrir({ tipo: "termo", termo: cat.termo })}
          />
        ))}
      </div>

      {isLoading && <Carregando data-gc="expressao.seletor.aba-gifs.carregando--2" />}
    </div>
  );
};

const Grade: React.FC<{
  gifs: GifModel[];
  favoritos: GifModel[];
  onGif: (gif: GifModel) => void;
}> = ({ gifs, favoritos, onGif }) => {
  const alternar = useToggleFavoriteGif();
  const salvos = new Set(favoritos.map((f) => f.id));

  return (
    <div data-gc="expressao.seletor.aba-gifs.div--5" className="columns-2 gap-2">
      {gifs.map((gif) => {
        const salvo = salvos.has(gif.id);

        return (
          <div data-gc="expressao.seletor.aba-gifs.div--6" key={gif.id} className="group relative mb-2 break-inside-avoid">
            <button data-gc="expressao.seletor.aba-gifs.button"
              onClick={() => onGif(gif)}
              title={gif.descricao}
              className="block w-full overflow-hidden rounded-lg ring-brand/70 transition hover:ring-2 focus-visible:ring-2"
            >
              <img data-gc="expressao.seletor.aba-gifs.img--2"
                src={gif.preview}
                alt={gif.descricao}
                loading="lazy"
                className="w-full transition duration-200 group-hover:scale-[1.03]"
              />
            </button>

            <button data-gc="expressao.seletor.aba-gifs.button--2"
              onClick={() => alternar.mutate({ gif, salvo })}
              aria-label={salvo ? "Tirar dos favoritos" : "Guardar nos favoritos"}
              title={salvo ? "Tirar dos favoritos" : "Guardar nos favoritos"}
              className={cn(
                "absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/55 backdrop-blur transition",
                "hover:bg-black/75 focus-visible:opacity-100",
                salvo ? "text-brand opacity-100" : "text-white opacity-0 group-hover:opacity-100",
              )}
            >
              <Star data-gc="expressao.seletor.aba-gifs.star--2" size={14} className={salvo ? "fill-current" : undefined} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const SemChave: React.FC = () => (
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
