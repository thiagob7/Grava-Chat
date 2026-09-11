import React from "react";
import { FileCode2, Image as Picture } from "lucide-react";
import type { ThemeActive } from "@gravae/shared";
import { weightReadable } from "@gravae/shared";

const isImage = (active: ThemeActive) =>
  active.kind ? active.kind.startsWith("image/") : /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(active.name);

/*
  O que a pessoa precisa saber antes de instalar: que o tema traz imagem, qual
  é a imagem, e quanto isso vai pesar. Sem isso ela clica em importar às cegas.
*/
export const ActivePreview: React.FC<{
  actives: ThemeActive[] | undefined;
  weight: number;
  compact?: boolean;
}> = ({ actives, weight, compact }) => {
  /* Aceita `undefined` de propósito: quem desenha conteúdo remoto não confia
     no formato dele. Ver o comentário em `requests/tema/temas.ts`. */
  if (!actives?.length) return null;

  const images = actives.filter(isImage);
  const show = images.slice(0, compact ? 3 : 4);
  const leftover = images.length - show.length;
  const files = actives.length - images.length;

  return (
    <div data-gc="tema.previa-dos-ativos.div" className="mt-4">
      {show.length > 0 && (
        <div data-gc="tema.previa-dos-ativos.div--2" className="flex gap-2">
          {show.map((active) => (
            <span data-gc="tema.previa-dos-ativos.span"
              key={active.url}
              title={active.name}
              className="flex h-16 flex-1 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-1"
            >
              <img data-gc="tema.previa-dos-ativos.img"
                src={active.url}
                alt={active.name}
                loading="lazy"
                className="size-full object-cover"
              />
            </span>
          ))}

          {leftover > 0 && (
            <span data-gc="tema.previa-dos-ativos.span--2" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-1 text-sm font-medium text-ink-faint">
              +{leftover}
            </span>
          )}
        </div>
      )}

      <p data-gc="tema.previa-dos-ativos.p" className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
        {images.length > 0 ? <Picture data-gc="tema.previa-dos-ativos.picture" size={13} /> : <FileCode2 data-gc="tema.previa-dos-ativos.file-code2" size={13} />}

        {[
          images.length > 0 &&
            `${images.length} ${images.length === 1 ? "imagem" : "imagens"}`,
          files > 0 && `${files} ${files === 1 ? "arquivo" : "arquivos"}`,
          `${weightReadable(weight)} no total`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </div>
  );
};
