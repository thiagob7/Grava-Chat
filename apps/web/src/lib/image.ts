export const MAX_IMAGE_W = 420;
export const MAX_IMAGE_H = 340;

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
    return { file, ...(await measure(file)) };
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { file, width: null, height: null };

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));

  if (scale === 1 && file.size < 200 * 1024) {
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return { file, ...dimensions };
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { file, width: bitmap.width, height: bitmap.height };
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );

  if (!blob || blob.size >= file.size) return { file, width: width, height: height };

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return { file: new File([blob], name, { type: "image/webp" }), width: width, height: height };
}

async function measure(file: File): Promise<{ width: number | null; height: number | null }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return { width: null, height: null };

  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

export const isImageType = (type: string) => type.startsWith("image/");

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
