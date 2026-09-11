import React, { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Copy,
  Download,
  ExternalLink,
  Link2,
  Maximize,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Tooltip } from "~/components/ui/tooltip";
import { downloadImage, copyImage } from "~/lib/imagem";
import { copyText } from "~/lib/copiar";
import { useLightbox } from "~/stores/lightbox";
import { cn } from "~/lib/utils";

const STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

function sizeReadable(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ImageViewer: React.FC = () => {
  const { t } = useTranslation();
  const url = useLightbox((s) => s.url);
  const alt = useLightbox((s) => s.alt);
  const info = useLightbox((s) => s.info);
  const close = useLightbox((s) => s.close);

  const [step, setStep] = useState(3);
  const [giro, setGiro] = useState(0);
  const [measure, setMeasure] = useState<{ width: number; height: number } | null>(null);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setStep(3);
    setGiro(0);
    setMeasure(null);
  }, [url]);

  useEffect(() => {
    if (!url) return;

    const inKeyboard = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") setStep((p) => Math.min(STEPS.length - 1, p + 1));
      if (e.key === "-") setStep((p) => Math.max(0, p - 1));
      if (e.key === "0") setStep(3);
    };

    window.addEventListener("keydown", inKeyboard);
    return () => window.removeEventListener("keydown", inKeyboard);
  }, [url]);

  if (!url) return null;

  const zoom = STEPS[step]!;
  const name = info.name || alt || "imagem";
  const size = sizeReadable(info.size);

  const actions = [
    { key: "fechar", label: t("comum.fechar"), icon: X, make: close },
    {
      key: "abrir",
      label: t("conversa.imagem.abrirLinkDaImagem"),
      icon: ExternalLink,
      make: () => window.open(url, "_blank", "noopener,noreferrer"),
    },
    {
      key: "link",
      label: t("conversa.imagem.copiarLinkDaImagem"),
      icon: Link2,
      make: () => void copyText(url).then(() => toast.success(t("conversa.imagem.linkCopiado"))),
    },
    {
      key: "copiar",
      label: t("conversa.imagem.copiarImagem"),
      icon: Copy,
      make: () =>
        void copyImage(url).then((gave) =>
          gave ? toast.success(t("conversa.imagem.imagemCopiada")) : toast.error(t("conversa.imagem.naoDeuParaCopiar")),
        ),
    },
    { key: "baixar", label: t("conversa.imagem.baixarImagem"), icon: Download, make: () => void downloadImage(url, name) },
    { key: "esquerda", label: t("conversa.imagem.girarEsquerda"), icon: RotateCcw, make: () => setGiro((g) => g - 90) },
    { key: "direita", label: t("conversa.imagem.girarDireita"), icon: RotateCw, make: () => setGiro((g) => g + 90) },
    { key: "ajustar", label: t("conversa.imagem.ajustar"), icon: Maximize, make: () => { setStep(3); setGiro(0); } },
    { key: "mais", label: t("conversa.imagem.ampliar"), icon: ZoomIn, make: () => setStep((p) => Math.min(STEPS.length - 1, p + 1)) },
    { key: "menos", label: t("conversa.imagem.reduzir"), icon: ZoomOut, make: () => setStep((p) => Math.max(0, p - 1)) },
  ];

  return (
    <DialogPrimitive.Root data-gc="visualizador-de-imagem.dialog-primitiveroot" open onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay data-gc="visualizador-de-imagem.dialog-primitiveoverlay" className="fixed inset-0 z-50 bg-veu" />

        <DialogPrimitive.Content data-gc="visualizador-de-imagem.dialog-primitivecontent"
          aria-describedby={undefined}
          className="regiao-sem-arrasto fixed inset-0 z-50 flex flex-col outline-none"
        >
          <DialogPrimitive.Title data-gc="visualizador-de-imagem.dialog-primitivetitle" className="sr-only">{name}</DialogPrimitive.Title>

          <div data-gc="visualizador-de-imagem.div"
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6"
            onClick={(e) => e.target === e.currentTarget && close()}
          >
            <img data-gc="visualizador-de-imagem.img"
              ref={image}
              src={url}
              alt={alt}
              onLoad={(e) =>
                setMeasure({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })
              }
              className={cn(
                "rounded object-contain shadow-2xl transition-transform duration-150",
                zoom <= 1 && "max-h-[calc(100vh-8rem)] max-w-full",
              )}
              style={{ transform: `rotate(${giro}deg) scale(${zoom})` }}
            />
          </div>

          <div data-gc="visualizador-de-imagem.div--2" className="flex shrink-0 items-center gap-1 border-t border-line bg-surface-1 px-3 py-2">
            {actions.map((action) => (
              <Tooltip data-gc="visualizador-de-imagem.tooltip" key={action.key} label={action.label} side="top">
                <button data-gc="visualizador-de-imagem.button.make"
                  type="button"
                  aria-label={action.label}
                  onClick={action.make}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition hover:bg-surface-3 hover:text-ink"
                >
                  <action.icon data-gc="visualizador-de-imagem.actionicon" size={17} />
                </button>
              </Tooltip>
            ))}

            <p data-gc="visualizador-de-imagem.p" className="ml-auto flex min-w-0 items-center gap-3 pl-3 text-xs text-ink-faint">
              <span data-gc="visualizador-de-imagem.span" className="max-w-64 truncate text-ink-muted">{name}</span>
              {measure && <span data-gc="visualizador-de-imagem.span--2">{measure.width}×{measure.height}</span>}
              {size && <span data-gc="visualizador-de-imagem.span--3">{size}</span>}
              <span data-gc="visualizador-de-imagem.span--4" className="tabular-nums">{Math.round(zoom * 100)}%</span>
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
