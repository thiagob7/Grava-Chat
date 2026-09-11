import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, RotateCcw } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Slider } from "~/components/ui/slider";
import { useTranslation } from "~/traducao";

const SIDE = 256;

interface Props {
  file: File | null;
  onCancel: () => void;
  onReady: (cropped: File) => void;
}

export const ImageCrop: React.FC<Props> = ({ file, onCancel, onReady }) => {
  const { t } = useTranslation();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!file) return setImage(null);

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      setImage(img);
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return null;

  const base = image ? SIDE / Math.min(image.width, image.height) : 1;
  const scale = base * zoom;
  const width = (image?.width ?? 0) * scale;
  const height = (image?.height ?? 0) * scale;

  const limit = (x: number, y: number) => ({
    x: Math.min(0, Math.max(SIDE - width, x)),
    y: Math.min(0, Math.max(SIDE - height, y)),
  });

  const center = { x: (SIDE - width) / 2, y: (SIDE - height) / 2 };
  const current = image ? limit(pos.x || center.x, pos.y || center.y) : { x: 0, y: 0 };

  const save = async () => {
    if (!image) return;

    const canvas = document.createElement("canvas");
    canvas.width = SIDE;
    canvas.height = SIDE;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(image, current.x, current.y, width, height);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.9));
    if (!blob) return;

    onReady(new File([blob], "icone.webp", { type: "image/webp" }));
  };

  return (
    <Dialog data-gc="recorte-de-imagem.dialog" open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent data-gc="recorte-de-imagem.dialog-content">
        <DialogHeader data-gc="recorte-de-imagem.dialog-header">
          <DialogTitle data-gc="recorte-de-imagem.dialog-title">{t("comum.recorte.titulo")}</DialogTitle>
          <DialogDescription data-gc="recorte-de-imagem.dialog-description">
            {t("comum.recorte.detalhe")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody data-gc="recorte-de-imagem.dialog-body">
          <div data-gc="recorte-de-imagem.div"
            className="relative mx-auto cursor-grab overflow-hidden rounded-full bg-surface-0 active:cursor-grabbing"
            style={{ width: SIDE, height: SIDE, touchAction: "none" }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { x: e.clientX - current.x, y: e.clientY - current.y };
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              setPos(limit(e.clientX - drag.current.x, e.clientY - drag.current.y));
            }}
            onPointerUp={() => (drag.current = null)}
          >
            {image && (
              <img data-gc="recorte-de-imagem.img"
                src={image.src}
                alt=""
                draggable={false}
                className="max-w-none select-none"
                style={{
                  width: width,
                  height: height,
                  transform: `translate(${current.x}px, ${current.y}px)`,
                }}
              />
            )}
          </div>

          <div data-gc="recorte-de-imagem.div--2" className="mx-auto mt-4 flex max-w-xs items-center gap-3">
            <ImageIcon data-gc="recorte-de-imagem.image-icon" size={14} className="shrink-0 text-ink-faint" />
            <Slider data-gc="recorte-de-imagem.slider"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              filled={(zoom - 1) / 2}
              onChange={(e) => {
                const next = Number(e.target.value);
                setZoom(next);
                setPos((p) => limit(p.x, p.y));
              }}
            />
            <ImageIcon data-gc="recorte-de-imagem.image-icon--2" size={20} className="shrink-0 text-ink-faint" />

            <button data-gc="recorte-de-imagem.button"
              onClick={() => {
                setZoom(1);
                setPos({ x: 0, y: 0 });
              }}
              title={t("comum.recorte.voltarAoComeco")}
              className="shrink-0 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <RotateCcw data-gc="recorte-de-imagem.rotate-ccw" size={14} />
            </button>
          </div>
        </DialogBody>

        <DialogFooter data-gc="recorte-de-imagem.dialog-footer">
          <Button data-gc="recorte-de-imagem.button.on-cancel" variant="ghost" onClick={onCancel}>
            {t("comum.cancelar")}
          </Button>
          <Button data-gc="recorte-de-imagem.button--2" onClick={() => void save()} disabled={!image}>
            {t("comum.recorte.usar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
