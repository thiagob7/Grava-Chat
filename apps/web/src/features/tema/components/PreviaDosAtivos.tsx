import React from "react";
import { FileCode2, Image as Imagem } from "lucide-react";
import type { AtivoDoTema } from "@gravae/shared";
import { pesoLegivel } from "@gravae/shared";

const ehImagem = (ativo: AtivoDoTema) =>
  ativo.tipo ? ativo.tipo.startsWith("image/") : /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(ativo.nome);

/*
  O que a pessoa precisa saber antes de instalar: que o tema traz imagem, qual
  é a imagem, e quanto isso vai pesar. Sem isso ela clica em importar às cegas.
*/
export const PreviaDosAtivos: React.FC<{
  ativos: AtivoDoTema[];
  peso: number;
  compacto?: boolean;
}> = ({ ativos, peso, compacto }) => {
  if (!ativos.length) return null;

  const imagens = ativos.filter(ehImagem);
  const mostrar = imagens.slice(0, compacto ? 3 : 4);
  const sobrando = imagens.length - mostrar.length;
  const arquivos = ativos.length - imagens.length;

  return (
    <div data-gc="tema.previa-dos-ativos.div" className="mt-4">
      {mostrar.length > 0 && (
        <div data-gc="tema.previa-dos-ativos.div--2" className="flex gap-2">
          {mostrar.map((ativo) => (
            <span data-gc="tema.previa-dos-ativos.span"
              key={ativo.url}
              title={ativo.nome}
              className="flex h-16 flex-1 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-1"
            >
              <img data-gc="tema.previa-dos-ativos.img"
                src={ativo.url}
                alt={ativo.nome}
                loading="lazy"
                className="size-full object-cover"
              />
            </span>
          ))}

          {sobrando > 0 && (
            <span data-gc="tema.previa-dos-ativos.span--2" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-1 text-sm font-medium text-ink-faint">
              +{sobrando}
            </span>
          )}
        </div>
      )}

      <p data-gc="tema.previa-dos-ativos.p" className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
        {imagens.length > 0 ? <Imagem data-gc="tema.previa-dos-ativos.imagem" size={13} /> : <FileCode2 data-gc="tema.previa-dos-ativos.file-code2" size={13} />}

        {[
          imagens.length > 0 &&
            `${imagens.length} ${imagens.length === 1 ? "imagem" : "imagens"}`,
          arquivos > 0 && `${arquivos} ${arquivos === 1 ? "arquivo" : "arquivos"}`,
          `${pesoLegivel(peso)} no total`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
};
