import React, { useEffect, useRef, useState } from "react";
import { ArrowClockwise, Image as ImageIcon } from "@phosphor-icons/react";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

interface Frame {
  zoom: number;
  x: number;
  y: number;
  turn: number;
}

const START: Frame = { zoom: 1, x: 0, y: 0, turn: 0 };

/*
  A moldura fica parada e a imagem anda por baixo. Guardamos só o enquadramento
  — zoom, deslocamento e giro —, e o recorte é feito uma vez, no Aplicar.

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
  aspect: number;
  exportWidth: number;
  /** JPEG por padrão. WebP para quem precisa guardar o transparente. */
  mime?: "image/jpeg" | "image/webp";
  /** Desenha a guia redonda, para o que vai virar foto de perfil. */
  round?: boolean;
  onCancel: () => void;
  onApply: (file: File) => void;
}> = ({ file, aspect, exportWidth, mime = "image/jpeg", round = false, onCancel, onApply }) => {
  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState<Frame>(START);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ x: number; y: number; from: Frame } | null>(null);

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
    const measure = () => {
      const width = stage.current?.clientWidth ?? 0;
      setBox({ width, height: Math.round(width / aspect) });
    };

    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, [aspect, file]);

  if (!file) return null;

  const sideways = frame.turn % 180 !== 0;
  const naturalWidth = source?.naturalWidth ?? 1;
  const naturalHeight = source?.naturalHeight ?? 1;
  const asSeenWidth = sideways ? naturalHeight : naturalWidth;
  const asSeenHeight = sideways ? naturalWidth : naturalHeight;

  const cover = box.width
    ? Math.max(box.width / asSeenWidth, box.height / asSeenHeight)
    : 1;

  const coverWidth = naturalWidth * cover;
  const coverHeight = naturalHeight * cover;

  const change = (next: Partial<Frame>) =>
    setFrame((old) => holdInside({ ...old, ...next }, coverWidth, coverHeight, box.width, box.height));

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

  const apply = () => {
    if (!source) return;

    const width = exportWidth;
    const height = Math.round(width / aspect);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const paper = canvas.getContext("2d");
    if (!paper) return;

    /* O mesmo enquadramento da tela, na escala do arquivo de saída. */
    const factor = box.width ? width / box.width : 1;

    paper.translate(width / 2 + frame.x * factor, height / 2 + frame.y * factor);
    paper.rotate((frame.turn * Math.PI) / 180);
    paper.scale(cover * frame.zoom * factor, cover * frame.zoom * factor);
    paper.drawImage(source, -naturalWidth / 2, -naturalHeight / 2);

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

  return (
    <Dialog data-gc="editor-de-imagem.dialog" open onOpenChange={(next) => !next && onCancel()}>
      <DialogContent data-gc="editor-de-imagem.dialog-content" className="max-w-md">
        <DialogTitle data-gc="editor-de-imagem.dialog-title" className="text-base font-semibold">Editar imagem</DialogTitle>

        <div data-gc="editor-de-imagem.div"
          ref={stage}
          className="relative mt-4 select-none overflow-hidden rounded-lg bg-surface-3"
          style={{ height: box.height || undefined }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {source && (
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

          {/* A guia redonda vira um furo: o que fica de fora sai escurecido. */}
          {round ? (
            <div data-gc="editor-de-imagem.div"
              aria-hidden
              className="pointer-events-none absolute inset-0 m-auto aspect-square rounded-full shadow-[0_0_0_9999px_var(--color-sobre-midia)] ring-2 ring-sobre-marca/90"
            />
          ) : (
            <div data-gc="editor-de-imagem.div--2"
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-inset ring-sobre-marca/90"
            />
          )}
        </div>

        <div data-gc="editor-de-imagem.div--3" className="mt-4 flex items-center gap-3">
          <ImageIcon data-gc="editor-de-imagem.image-icon" size={16} className="shrink-0 text-ink-faint" />

          <input data-gc="editor-de-imagem.input"
            type="range"
            aria-label="Aproximar"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.01}
            value={frame.zoom}
            onChange={(event) => change({ zoom: Number(event.target.value) })}
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-brand"
          />

          <ImageIcon data-gc="editor-de-imagem.image-icon--2" size={24} className="shrink-0 text-ink-faint" />

          <button data-gc="editor-de-imagem.button.turn"
            type="button"
            aria-label="Girar"
            onClick={() => change({ turn: (frame.turn + 90) % 360 })}
            className={cn("ml-2 shrink-0 rounded p-1.5 text-ink-muted transition hover:bg-hover hover:text-ink")}
          >
            <ArrowClockwise data-gc="editor-de-imagem.arrow-clockwise" size={18} />
          </button>
        </div>

        <DialogFooter data-gc="editor-de-imagem.dialog-footer">
          <Button data-gc="editor-de-imagem.button.reset" variant="link" className="mr-auto" onClick={() => setFrame(START)}>
            Redefinir
          </Button>

          <Button data-gc="editor-de-imagem.button.on-cancel" variant="surface" onClick={onCancel}>
            Cancelar
          </Button>

          <Button data-gc="editor-de-imagem.button.apply" disabled={!source} onClick={apply}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
