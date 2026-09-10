import React from "react";
import { Palette } from "lucide-react";

import { pesoDoTema, pesoLegivel } from "@gravae/shared";

import { useTema } from "~/@core/application/queries/tema/use-temas";
import { Button } from "~/components/ui/button";
import { useImportarTema } from "~/features/tema/stores/importar-tema";

export const CartaoDeTema: React.FC<{ temaId: string }> = ({ temaId }) => {
  const { data: tema, isLoading, isError } = useTema(temaId);
  const abrirImportacao = useImportarTema((s) => s.abrir);

  if (isLoading)
    return (
      <div data-gc="tema.cartao-de-tema.div" className="mt-1 h-[6.5rem] w-72 animate-pulse rounded-lg border border-line bg-surface-2" />
    );

  if (isError || !tema)
    return (
      <div data-gc="tema.cartao-de-tema.div--2" className="mt-1 w-72 rounded-lg border border-line bg-surface-2 p-3">
        <p data-gc="tema.cartao-de-tema.p" className="text-sm font-medium text-ink-muted">Tema indisponível</p>
        <p data-gc="tema.cartao-de-tema.p--2" className="mt-0.5 text-xs text-ink-faint">
          Quem publicou apagou, ou o link está errado.
        </p>
      </div>
    );

  const temCss = tema.css.trim().length > 0;
  const quantosTokens = Object.keys(tema.substituicoes).length;

  const resumo = [
    temCss && "Você tem CSS!",
    quantosTokens > 0 && `${quantosTokens} ${quantosTokens === 1 ? "cor" : "cores"}`,
    tema.ativos.length > 0 &&
      `${tema.ativos.length} ${tema.ativos.length === 1 ? "imagem" : "imagens"}`,
    tema.ativos.length > 0 && pesoLegivel(pesoDoTema(tema.css, tema.ativos)),
  ]
    .filter(Boolean)
    .join(" · ");

  const capa = tema.ativos.find((ativo) =>
    ativo.tipo
      ? ativo.tipo.startsWith("image/")
      : /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(ativo.nome),
  );

  return (
    <article data-gc="tema.cartao-de-tema.article" className="mt-1 w-72 overflow-hidden rounded-lg border border-line bg-surface-2">
      {capa && (
        <img data-gc="tema.cartao-de-tema.img"
          src={capa.url}
          alt=""
          loading="lazy"
          className="h-24 w-full border-b border-line object-cover"
        />
      )}

      <div data-gc="tema.cartao-de-tema.div--3" className="flex items-center gap-3 p-3">
        <span data-gc="tema.cartao-de-tema.span" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sobre-marca">
          <Palette data-gc="tema.cartao-de-tema.palette" size={20} />
        </span>

        <div data-gc="tema.cartao-de-tema.div--4" className="min-w-0 flex-1">
          <p data-gc="tema.cartao-de-tema.p--3" className="truncate text-sm font-semibold">{tema.nome}</p>
          <p data-gc="tema.cartao-de-tema.p--4" className="truncate text-xs text-ink-faint">{resumo}</p>
        </div>
      </div>

      {(tema.descricao || tema.autor || tema.versao) && (
        <div data-gc="tema.cartao-de-tema.div--5" className="px-3 pb-2">
          {tema.descricao && (
            <p data-gc="tema.cartao-de-tema.p--5" className="line-clamp-2 text-xs text-ink-muted">{tema.descricao}</p>
          )}

          {(tema.autor || tema.versao) && (
            <p data-gc="tema.cartao-de-tema.p--6" className="mt-1 truncate text-xs text-ink-faint">
              {[tema.autor && `por ${tema.autor}`, tema.versao && `v${tema.versao}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      )}

      <div data-gc="tema.cartao-de-tema.div--6" className="p-3 pt-1">
        <Button data-gc="tema.cartao-de-tema.button"
          size="sm"
          className="w-full"
          onClick={() => abrirImportacao(tema.id)}
        >
          Importar tema
        </Button>
      </div>
    </article>
  );
};
