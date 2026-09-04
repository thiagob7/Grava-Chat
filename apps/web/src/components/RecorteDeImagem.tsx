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

const LADO = 256;

interface Props {
  arquivo: File | null;
  onCancelar: () => void;
  onPronto: (recortado: File) => void;
}

export const RecorteDeImagem: React.FC<Props> = ({ arquivo, onCancelar, onPronto }) => {
  const [imagem, setImagem] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const arrasto = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!arquivo) return setImagem(null);

    const url = URL.createObjectURL(arquivo);
    const img = new Image();

    img.onload = () => {
      setImagem(img);
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  if (!arquivo) return null;

  const base = imagem ? LADO / Math.min(imagem.width, imagem.height) : 1;
  const escala = base * zoom;
  const largura = (imagem?.width ?? 0) * escala;
  const altura = (imagem?.height ?? 0) * escala;

  const limitar = (x: number, y: number) => ({
    x: Math.min(0, Math.max(LADO - largura, x)),
    y: Math.min(0, Math.max(LADO - altura, y)),
  });

  const centro = { x: (LADO - largura) / 2, y: (LADO - altura) / 2 };
  const atual = imagem ? limitar(pos.x || centro.x, pos.y || centro.y) : { x: 0, y: 0 };

  const salvar = async () => {
    if (!imagem) return;

    const canvas = document.createElement("canvas");
    canvas.width = LADO;
    canvas.height = LADO;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(imagem, atual.x, atual.y, largura, altura);

    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.9));
    if (!blob) return;

    onPronto(new File([blob], "icone.webp", { type: "image/webp" }));
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onCancelar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recortar o ícone</DialogTitle>
          <DialogDescription>
            Arraste para escolher o pedaço e use a barra para aproximar. O ícone
            fica redondo em todo lugar do app.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div
            className="relative mx-auto cursor-grab overflow-hidden rounded-full bg-surface-0 active:cursor-grabbing"
            style={{ width: LADO, height: LADO, touchAction: "none" }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              arrasto.current = { x: e.clientX - atual.x, y: e.clientY - atual.y };
            }}
            onPointerMove={(e) => {
              if (!arrasto.current) return;
              setPos(limitar(e.clientX - arrasto.current.x, e.clientY - arrasto.current.y));
            }}
            onPointerUp={() => (arrasto.current = null)}
          >
            {imagem && (
              <img
                src={imagem.src}
                alt=""
                draggable={false}
                className="max-w-none select-none"
                style={{
                  width: largura,
                  height: altura,
                  transform: `translate(${atual.x}px, ${atual.y}px)`,
                }}
              />
            )}
          </div>

          <div className="mx-auto mt-4 flex max-w-xs items-center gap-3">
            <ImageIcon size={14} className="shrink-0 text-ink-faint" />
            <Slider
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              preenchido={(zoom - 1) / 2}
              onChange={(e) => {
                const proximo = Number(e.target.value);
                setZoom(proximo);
                setPos((p) => limitar(p.x, p.y));
              }}
            />
            <ImageIcon size={20} className="shrink-0 text-ink-faint" />

            <button
              onClick={() => {
                setZoom(1);
                setPos({ x: 0, y: 0 });
              }}
              title="Voltar ao começo"
              className="shrink-0 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button onClick={() => void salvar()} disabled={!imagem}>
            Usar este recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
