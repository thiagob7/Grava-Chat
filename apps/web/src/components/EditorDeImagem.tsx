import React, { useEffect, useRef, useState } from "react";
import { ArrowClockwise, ArrowsVertical, Image as ImageIcon, MagnifyingGlassPlus } from "@phosphor-icons/react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { cropGif } from "~/lib/recortar-gif";
import { cn } from "~/lib/utils";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

interface Frame {
  zoom: number;
  x: number;
  y: number;
  turn: number;
  height: number;
}

const START: Frame = { zoom: 1, x: 0, y: 0, turn: 0, height: 0 };

/*
  A moldura fica parada e a imagem anda por baixo. Guardamos só o enquadramento
  — zoom, deslocamento, giro e altura —, e o recorte é feito uma vez, no Salvar.

  O deslocamento é preso para a imagem nunca deixar buraco dentro da moldura:
  sem isso dá para arrastar até sobrar fundo, e o recorte sai com uma faixa
  vazia que ninguém pediu.
*/
const holdInside = (frame: Frame, coverWidth: number, coverHeight: number, boxWidth: number, boxHeight: number): Frame => {
  const sideways = frame.turn % 180 !== 0;
  const width = (sideways ? coverHeight : coverWidth) * frame.zoom;
  const height = (sideways ? coverWidth : coverHeight) * frame.zoom;

  const roomX = Math.max(0, (width - boxWidth) / 2);
  const roomY = Math.max(0, (height - boxHeight) / 2);

  return {
    ...frame,
    x: Math.min(roomX, Math.max(-roomX, frame.x)),
    y: Math.min(roomY, Math.max(-roomY, frame.y)),
  };
};

export const ImageEditor: React.FC<{
  file: File | null;
  /** Proporção largura/altura do recorte com a Altura no zero. */
  aspect: number;
  exportWidth: number;
  /** JPEG por padrão. WebP para quem precisa guardar o transparente. */
  mime?: "image/jpeg" | "image/webp";
  /** Desenha a guia redonda, para o que vai virar foto ou ícone. */
  round?: boolean;
  title?: string;
  description?: string;
  applyLabel?: string;
  /** A proporção mais alta que o controle de Altura alcança. Sem ele, o controle não aparece. */
  tallestAspect?: number;
  /** Largura do GIF recortado; quadro animado pesa, então sai menor que a imagem parada. */
  gifWidth?: number;
  /** Teto em bytes do GIF recortado: passando, ele é refeito menor. */
  gifMaxBytes?: number;
  /** Mostra "Pular corte": sobe o arquivo como veio. */
  onSkip?: () => void;
  onCancel: () => void;
  onApply: (file: File) => void;
}> = ({
  file,
  aspect,
  exportWidth,
  mime = "image/jpeg",
  round = false,
  title = "Editar imagem",
  description,
  applyLabel = "Aplicar",
  tallestAspect,
  gifWidth = 320,
  gifMaxBytes = 2 * 1024 * 1024,
  onSkip,
  onCancel,
  onApply,
}) => {
  const [working, setWorking] = useState(false);
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState<Frame>(START);
  const [stageWidth, setStageWidth] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ x: number; y: number; from: Frame } | null>(null);

  const currentAspect = tallestAspect ? aspect + (tallestAspect - aspect) * frame.height : aspect;

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      setSource(image);
      setFrame(START);
    };
    image.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const measure = () => setStageWidth(stage.current?.clientWidth ?? 0);

    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, [file, source]);

  if (!file) return null;

  /*
    A guia redonda ocupa a altura do palco e deixa sobra dos lados, para dar para
    ver o que fica de fora. As retangulares ocupam a largura toda.
  */
  const boxWidth = Math.max(0, round ? Math.round(stageWidth * 0.62) : stageWidth - 40);
  const boxHeight = Math.round(boxWidth / currentAspect);

  const sideways = frame.turn % 180 !== 0;
  const naturalWidth = source?.naturalWidth ?? 1;
  const naturalHeight = source?.naturalHeight ?? 1;
  const asSeenWidth = sideways ? naturalHeight : naturalWidth;
  const asSeenHeight = sideways ? naturalWidth : naturalHeight;

  const cover = boxWidth ? Math.max(boxWidth / asSeenWidth, boxHeight / asSeenHeight) : 1;
  const coverWidth = naturalWidth * cover;
  const coverHeight = naturalHeight * cover;

  const change = (next: Partial<Frame>) =>
    setFrame((old) => {
      const merged = { ...old, ...next };
      const nextAspect = tallestAspect ? aspect + (tallestAspect - aspect) * merged.height : aspect;
      const nextBoxHeight = Math.round(boxWidth / nextAspect);
      const nextCover = boxWidth
        ? Math.max(
            boxWidth / (merged.turn % 180 !== 0 ? naturalHeight : naturalWidth),
            nextBoxHeight / (merged.turn % 180 !== 0 ? naturalWidth : naturalHeight),
          )
        : 1;

      return holdInside(merged, naturalWidth * nextCover, naturalHeight * nextCover, boxWidth, nextBoxHeight);
    });

  const startDrag = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging.current = { x: event.clientX, y: event.clientY, from: frame };
  };

  const moveDrag = (event: React.PointerEvent) => {
    const grip = dragging.current;
    if (!grip) return;

    change({
      x: grip.from.x + (event.clientX - grip.x),
      y: grip.from.y + (event.clientY - grip.y),
    });
  };

  const endDrag = () => {
    dragging.current = null;
  };

  const zoomBy = (delta: number) =>
    change({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, frame.zoom + delta)) });

  const isGif = file.type === "image/gif";

  const apply = async () => {
    if (!source || working) return;

    const width = isGif ? Math.min(gifWidth, exportWidth) : exportWidth;
    const height = Math.round(width / currentAspect);

    const paint = (paper: CanvasRenderingContext2D, image: CanvasImageSource, scale = 1) => {
      const factor = boxWidth ? (width * scale) / boxWidth : 1;
      const w = width * scale;
      const h = height * scale;

      paper.translate(w / 2 + frame.x * factor, h / 2 + frame.y * factor);
      paper.rotate((frame.turn * Math.PI) / 180);
      paper.scale(cover * frame.zoom * factor, cover * frame.zoom * factor);
      paper.drawImage(image, -naturalWidth / 2, -naturalHeight / 2);
    };

    if (file.type === "image/webp" && onSkip && (await isAnimatedWebp(file))) {
      onSkip();
      return;
    }

    if (isGif) {
      setWorking(true);
      try {
        onApply(await cropGif(file, width, height, paint, gifMaxBytes));
      } catch {
        onSkip?.();
      } finally {
        setWorking(false);
      }
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const paper = canvas.getContext("2d");
    if (!paper) return;

    paint(paper, source);

    const extension = mime === "image/webp" ? ".webp" : ".jpg";

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        onApply(new File([blob], file.name.replace(/\.[^.]+$/, "") + extension, { type: mime }));
      },
      mime,
      0.92,
    );
  };

  const untouched =
    frame.zoom === START.zoom && frame.x === 0 && frame.y === 0 && frame.turn === 0 && frame.height === 0;

  return (
    <Dialog data-gc="editor-de-imagem.dialog" open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent data-gc="editor-de-imagem.dialog-content" className={cn(round || aspect <= 1.2 ? "max-w-lg" : "max-w-2xl")}>
        <div data-gc="editor-de-imagem.div" className="px-5 pt-5">
          <DialogTitle data-gc="editor-de-imagem.dialog-title" className="text-lg font-semibold">{title}</DialogTitle>
          {description && <DialogDescription data-gc="editor-de-imagem.dialog-description" className="mt-1.5 text-sm text-ink-muted">{description}</DialogDescription>}
        </div>

        <div data-gc="editor-de-imagem.div--2" className="px-5 pt-4">
          <div data-gc="editor-de-imagem.div.start-drag"
            ref={stage}
            className="relative flex select-none items-center justify-center overflow-hidden rounded-lg bg-surface-0 touch-none"
            style={{ height: boxHeight ? boxHeight + 40 : 240 }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={(event) => zoomBy(-event.deltaY * 0.0015)}
          >
            <div data-gc="editor-de-imagem.div--3" className="relative shrink-0" style={{ width: boxWidth, height: boxHeight }}>
              {source && boxWidth > 0 && (
                <img data-gc="editor-de-imagem.img"
                  src={source.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
                  style={{
                    width: naturalWidth,
                    height: naturalHeight,
                    transform:
                      `translate(-50%, -50%) translate(${frame.x}px, ${frame.y}px) ` +
                      `rotate(${frame.turn}deg) scale(${cover * frame.zoom})`,
                  }}
                />
              )}

              {/* A moldura vira um furo: o que fica de fora sai escurecido. */}
              <div data-gc="editor-de-imagem.div--4"
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 shadow-[0_0_0_9999px_rgb(0_0_0/0.62)] ring-[3px] ring-palco-ink",
                  round ? "rounded-full" : "rounded-sm",
                )}
              />
            </div>
          </div>
        </div>

        <div data-gc="editor-de-imagem.div--5" className={cn("grid gap-x-6 gap-y-3 px-5 pt-4", tallestAspect ? "sm:grid-cols-[1fr_1fr_auto]" : "grid-cols-[1fr_auto]")}>
          <Control data-gc="editor-de-imagem.control" label="Zoom" small={<ImageIcon data-gc="editor-de-imagem.image-icon" size={14} />} large={<ImageIcon data-gc="editor-de-imagem.image-icon--2" size={22} />}>
            <input data-gc="editor-de-imagem.input"
              type="range"
              aria-label="Zoom"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={frame.zoom}
              onChange={(event) => change({ zoom: Number(event.target.value) })}
              className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-brand"
            />
          </Control>

          {tallestAspect && (
            <Control data-gc="editor-de-imagem.control--2"
              label="Altura"
              small={<span data-gc="editor-de-imagem.span" className="block h-1.5 w-3.5 rounded-sm bg-ink-faint" />}
              large={<span data-gc="editor-de-imagem.span--2" className="block h-3.5 w-3 rounded-sm bg-ink-faint" />}
            >
              <input data-gc="editor-de-imagem.input--2"
                type="range"
                aria-label="Altura"
                min={0}
                max={1}
                step={0.01}
                value={frame.height}
                onChange={(event) => change({ height: Number(event.target.value) })}
                className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-brand"
              />
            </Control>
          )}

          <div data-gc="editor-de-imagem.div--6" className="flex items-end justify-end gap-1 pb-0.5">
            <button data-gc="editor-de-imagem.button"
              type="button"
              aria-label="Girar"
              title="Girar"
              onClick={() => change({ turn: (frame.turn + 90) % 360 })}
              className="rounded-md p-2 text-ink-muted transition hover:bg-hover hover:text-ink"
            >
              <ArrowClockwise data-gc="editor-de-imagem.arrow-clockwise" size={18} />
            </button>
          </div>
        </div>

        <p data-gc="editor-de-imagem.p" className="flex items-center gap-1.5 px-5 pt-2 text-xs text-ink-faint">
          <MagnifyingGlassPlus data-gc="editor-de-imagem.magnifying-glass-plus" size={13} /> Arraste para posicionar e use a roda do mouse ou o gesto de pinça para o zoom.
          {tallestAspect && (
            <>
              {" "}
              <ArrowsVertical data-gc="editor-de-imagem.arrows-vertical" size={13} /> Altura muda o recorte.
            </>
          )}
        </p>

        <DialogFooter data-gc="editor-de-imagem.dialog-footer" className="mt-4">
          <Button data-gc="editor-de-imagem.button--2" variant="surface" className="mr-auto" disabled={untouched} onClick={() => setFrame(START)}>
            Redefinir
          </Button>

          <Button data-gc="editor-de-imagem.button.on-cancel" variant="surface" onClick={onCancel}>
            Cancelar
          </Button>

          {onSkip && (
            <Button data-gc="editor-de-imagem.button.on-skip" variant="surface" disabled={working} onClick={onSkip}>
              Pular corte
            </Button>
          )}

          <Button data-gc="editor-de-imagem.button--3" disabled={!source} loading={working} onClick={() => void apply()}>
            {applyLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const isAnimatedWebp = async (file: File) => {
  const head = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
  const text = new TextDecoder("latin1").decode(head);
  return text.startsWith("RIFF") && text.includes("ANIM");
};

const Control: React.FC<{ label: string; small: React.ReactNode; large: React.ReactNode; children: React.ReactNode }> = ({
  label,
  small,
  large,
  children,
}) => (
  <div data-gc="editor-de-imagem.div--7" className="min-w-0">
    <p data-gc="editor-de-imagem.p--2" className="mb-2 text-xs font-semibold text-ink-muted">{label}</p>
    <div data-gc="editor-de-imagem.div--8" className="flex items-center gap-3 text-ink-faint">
      <span data-gc="editor-de-imagem.span--3" className="flex w-5 shrink-0 justify-center">{small}</span>
      {children}
      <span data-gc="editor-de-imagem.span--4" className="flex w-6 shrink-0 justify-center">{large}</span>
    </div>
  </div>
);
