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
import { Carregando, Vazio } from "~/components/expression-picker/pecas";
import { cn } from "~/lib/utils";

/**
 * Duas telas na mesma aba: a capa, com as categorias, e a lista de GIFs de
 * uma delas. A capa é o que se vê ao abrir, como no Discord — cair direto nos
 * "em alta" não dava caminho nenhum pros favoritos.
 *
 * O que está aberto é `secao`: `null` na capa, "favoritos", "alta", ou o
 * termo de busca. Digitar na busca do topo abre a seção do termo digitado, e
 * apagar a busca volta pra capa.
 */
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

  /// A busca do topo manda na seção: escrever abre o termo, limpar volta pra
  /// capa. Sem isso, apagar o texto deixava a tela presa no último resultado.
  useEffect(() => {
    if (digitado) setSecao({ tipo: "termo", termo: digitado });
    else if (busca.trim() === "") setSecao((atual) => (atual?.tipo === "termo" ? null : atual));
  }, [digitado, busca]);

  const favoritos = useFavoriteGifs(disponivel);
  const alta = useTrendingGifs(disponivel && secao?.tipo === "alta");
  const resultado = useSearchGifs(secao?.tipo === "termo" ? secao.termo : "");

  if (config && !disponivel) return <SemChave />;

  if (!secao) {
    return (
      <Capa
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
    <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
      <button
        onClick={voltar}
        className="mb-2 flex shrink-0 items-center gap-1 self-start rounded py-1 pr-2 text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
      >
        <ChevronLeft size={14} />
        <span className="truncate">{titulo}</span>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {carregando && <Carregando />}

        {!carregando && !(lista ?? []).length && (
          <Vazio>
            {secao.tipo === "favoritos"
              ? "Você ainda não guardou nenhum GIF. Passe o mouse num GIF e clique na estrela."
              : "Nada por aqui."}
          </Vazio>
        )}

        <Grade gifs={lista ?? []} favoritos={favoritos.data ?? []} onGif={onGif} />
      </div>
    </div>
  );
};

/**
 * Um quadro da capa. Todos têm foto de fundo — a categoria traz a sua da
 * Klipy, "em alta" e "favoritos" emprestam o primeiro GIF que têm. Sem foto
 * (favoritos vazio) sobra o degradê da marca, que é o único caso em que um
 * quadro fica chapado.
 */
const Cartao: React.FC<{
  nome: string;
  preview?: string;
  icone?: React.ReactNode;
  selo?: number;
  onClick: () => void;
}> = ({ nome, preview, icone, selo, onClick }) => (
  <button
    onClick={onClick}
    className="group relative h-[86px] overflow-hidden rounded-lg ring-white/70 transition hover:ring-2"
  >
    {preview ? (
      <img
        src={preview}
        alt=""
        loading="lazy"
        className="size-full object-cover transition duration-200 group-hover:scale-105"
      />
    ) : (
      <span className="block size-full bg-gradient-to-br from-brand/70 to-brand-hover" />
    )}

    <span className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 px-2 text-center text-sm font-bold text-white drop-shadow transition group-hover:bg-black/25">
      {icone}
      {nome}
    </span>

    {selo !== undefined && selo > 0 && (
      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold text-white">
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
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      <div className="grid grid-cols-2 gap-2">
        <Cartao
          nome="Favoritos"
          preview={favoritos[0]?.preview}
          selo={favoritos.length}
          icone={<Star size={14} className="fill-current" />}
          onClick={() => onAbrir({ tipo: "favoritos" })}
        />

        <Cartao
          nome="GIFs em alta"
          preview={alta?.[0]?.preview}
          icone={<TrendingUp size={14} />}
          onClick={() => onAbrir({ tipo: "alta" })}
        />

        {(categorias ?? []).map((cat: CategoriaDeGifModel) => (
          <Cartao
            key={cat.termo}
            nome={cat.nome}
            preview={cat.preview}
            onClick={() => onAbrir({ tipo: "termo", termo: cat.termo })}
          />
        ))}
      </div>

      {isLoading && <Carregando />}
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
    <div className="columns-2 gap-2">
      {gifs.map((gif) => {
        const salvo = salvos.has(gif.id);

        return (
          <div key={gif.id} className="group relative mb-2 break-inside-avoid">
            <button
              onClick={() => onGif(gif)}
              title={gif.descricao}
              className="block w-full overflow-hidden rounded-lg ring-brand/70 transition hover:ring-2 focus-visible:ring-2"
            >
              <img
                src={gif.preview}
                alt={gif.descricao}
                loading="lazy"
                className="w-full transition duration-200 group-hover:scale-[1.03]"
              />
            </button>

            <button
              onClick={() => alternar.mutate({ gif, salvo })}
              aria-label={salvo ? "Tirar dos favoritos" : "Guardar nos favoritos"}
              title={salvo ? "Tirar dos favoritos" : "Guardar nos favoritos"}
              className={cn(
                "absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/55 backdrop-blur transition",
                "hover:bg-black/75 focus-visible:opacity-100",
                salvo ? "text-brand opacity-100" : "text-white opacity-0 group-hover:opacity-100",
              )}
            >
              <Star size={14} className={salvo ? "fill-current" : undefined} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const SemChave: React.FC = () => (
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
