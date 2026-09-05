import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ExternalLink, X } from "lucide-react";

import { useLightbox } from "~/stores/lightbox";

export const VisualizadorDeImagem: React.FC = () => {
  const url = useLightbox((s) => s.url);
  const alt = useLightbox((s) => s.alt);
  const fechar = useLightbox((s) => s.fechar);

  if (!url) return null;

  return (
    <DialogPrimitive.Root data-gc="visualizador-de-imagem.dialog-primitiveroot" open onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="visualizador-de-imagem.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-black/80" />

        <DialogPrimitive.Content data-gc="visualizador-de-imagem.dialog-primitivecontent"
          aria-describedby={undefined}
          className="regiao-sem-arrasto fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-10 outline-none"
          onClick={(e) => e.target === e.currentTarget && fechar()}
        >
          <DialogPrimitive.Title data-gc="visualizador-de-imagem.dialog-primitivetitle" className="sr-only">{alt || "Imagem"}</DialogPrimitive.Title>

          <img data-gc="visualizador-de-imagem.img"
            src={url}
            alt={alt}
            className="max-h-[80vh] max-w-full rounded object-contain shadow-2xl"
          />

          <a data-gc="visualizador-de-imagem.a"
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 text-xs text-ink-muted transition hover:text-ink"
          >
            <ExternalLink data-gc="visualizador-de-imagem.external-link" size={13} /> Abrir no navegador
          </a>

          <DialogPrimitive.Close
            aria-label="Fechar"
            className="absolute right-5 top-5 rounded p-1 text-ink-muted transition hover:bg-white/10 hover:text-ink"
          >
            <X data-gc="visualizador-de-imagem.x" size={24} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
