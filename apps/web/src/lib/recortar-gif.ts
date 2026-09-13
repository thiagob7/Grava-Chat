import { applyPalette, GIFEncoder, quantize } from "gifenc";
import { decompressFrames, parseGIF } from "gifuct-js";

export type PaintFrame = (paper: CanvasRenderingContext2D, source: CanvasImageSource, scale: number) => void;

const MAX_FRAMES = 300;

const breathe = () => new Promise((resolve) => setTimeout(resolve, 0));

async function encode(
  buffer: ArrayBuffer,
  width: number,
  height: number,
  paint: PaintFrame,
  scale: number,
) {
  const gif = parseGIF(buffer);
  const frames = decompressFrames(gif, true).slice(0, MAX_FRAMES);
  if (!frames.length) throw new Error("GIF sem quadros");

  const full = document.createElement("canvas");
  full.width = gif.lsd.width;
  full.height = gif.lsd.height;
  const fullPaper = full.getContext("2d", { willReadFrequently: true })!;

  const patch = document.createElement("canvas");
  const patchPaper = patch.getContext("2d")!;

  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const outPaper = out.getContext("2d", { willReadFrequently: true })!;

  const encoder = GIFEncoder();
  let restore: ImageData | null = null;
  let previous: (typeof frames)[number] | null = null;

  for (const [position, frame] of frames.entries()) {
    if (previous?.disposalType === 2) {
      const { left, top, width: w, height: h } = previous.dims;
      fullPaper.clearRect(left, top, w, h);
    } else if (previous?.disposalType === 3 && restore) {
      fullPaper.putImageData(restore, 0, 0);
    }

    restore = frame.disposalType === 3 ? fullPaper.getImageData(0, 0, full.width, full.height) : null;

    const { left, top, width: w, height: h } = frame.dims;
    if (patch.width !== w || patch.height !== h) {
      patch.width = w;
      patch.height = h;
    }
    patchPaper.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), w, h), 0, 0);
    fullPaper.drawImage(patch, left, top);

    outPaper.setTransform(1, 0, 0, 1, 0, 0);
    outPaper.clearRect(0, 0, width, height);
    paint(outPaper, full, scale);

    const { data } = outPaper.getImageData(0, 0, width, height);
    const palette = quantize(data, 256, { format: "rgba4444", oneBitAlpha: true });
    const index = applyPalette(data, palette, "rgba4444");
    const transparentIndex = palette.findIndex((color) => color[3] === 0);

    encoder.writeFrame(index, width, height, {
      palette,
      delay: Math.max(20, frame.delay || 100),
      transparent: transparentIndex >= 0,
      transparentIndex: Math.max(0, transparentIndex),
      dispose: 2,
    });

    previous = frame;
    if (position % 4 === 3) await breathe();
  }

  encoder.finish();
  return encoder.bytes();
}

export async function cropGif(
  file: File,
  width: number,
  height: number,
  paint: PaintFrame,
  maxBytes: number,
): Promise<File> {
  const buffer = await file.arrayBuffer();
  const name = file.name.replace(/\.[^.]+$/, "") + ".gif";

  for (const scale of [1, 0.75, 0.5, 0.35]) {
    const w = Math.max(32, Math.round(width * scale));
    const h = Math.max(32, Math.round(height * scale));
    const bytes = await encode(buffer, w, h, paint, (w / width));

    if (bytes.byteLength <= maxBytes || scale === 0.35) {
      return new File([bytes], name, { type: "image/gif" });
    }
  }

  throw new Error("GIF grande demais");
}
