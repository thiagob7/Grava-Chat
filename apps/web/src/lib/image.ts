export const MAX_IMAGEM_W = 420;
export const MAX_IMAGEM_H = 340;

export interface PreparedImage {
  file: File;
  width: number | null;
  height: number | null;
}

export async function resizeImage(
  file: File,
  { maxSize, quality = 0.85 }: { maxSize: number; quality?: number },
): Promise<PreparedImage> {
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return { file, ...(await medir(file)) };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { file, width: null, height: null };

  const escala = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));

  if (escala === 1 && file.size < 200 * 1024) {
    const dimensoes = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { file, ...dimensoes };
  }

  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { file, width: bitmap.width, height: bitmap.height };
  }

  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );

  if (!blob || blob.size >= file.size) return { file, width: largura, height: altura };

  const nome = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return { file: new File([blob], nome, { type: "image/webp" }), width: largura, height: altura };
}

async function medir(file: File): Promise<{ width: number | null; height: number | null }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { width: null, height: null };

  const dimensoes = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensoes;
}

export const isImageType = (type: string) => type.startsWith("image/");

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
