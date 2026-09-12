import { useState } from "react";
import type React from "react";

import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { formatBytes } from "~/lib/image";

const AVATAR_MAX_PX = 256;
const BANNER_MAX_PX = 640;

/* A faixa do cartão é desenhada nesta proporção; o recorte sai igual. */
export const AVATAR_ASPECT = 1;
export const BANNER_ASPECT = 20 / 7;

type Field = "avatarUrl" | "bannerUrl";

export interface ProfileImageFrame {
  file: File;
  field: Field;
  aspect: number;
  exportWidth: number;
}

const animated = (file: File) => file.type === "image/gif";

export function useImageProfileSending(
  set: (field: Field, url: string) => void,
) {
  const uploadImage = useUploadImage();
  const [saving, setSaving] = useState<string | null>(null);
  const [framing, setFraming] = useState<ProfileImageFrame | null>(null);

  const upload = async (file: File, field: Field) => {
    const photo = field === "avatarUrl";
    const result = await uploadImage
      .mutateAsync({
        file,
        maxSize: photo ? AVATAR_MAX_PX : BANNER_MAX_PX,
        purpose: photo ? "avatar" : "banner",
      })
      .catch(() => null);

    if (!result) return;

    set(field, result.attachment.url);
    setSaving(
      result.uploadedSize < result.originalSize
        ? `${formatBytes(result.originalSize)} → ${formatBytes(result.uploadedSize)}`
        : null,
    );
  };

  /*
    A imagem escolhida não sobe direto: primeiro a pessoa enquadra, e só o
    recorte vai para o servidor.

    O GIF é a exceção e passa reto. Enquadrar é desenhar num canvas, e isso
    devolveria um quadro parado — quem escolheu um GIF quer o GIF.
  */
  const send = async (event: React.ChangeEvent<HTMLInputElement>, field: Field) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (animated(file)) return upload(file, field);

    const photo = field === "avatarUrl";
    setFraming({
      file,
      field,
      aspect: photo ? AVATAR_ASPECT : BANNER_ASPECT,
      exportWidth: photo ? AVATAR_MAX_PX : BANNER_MAX_PX,
    });
  };

  const applyFrame = async (cut: File) => {
    const open = framing;
    setFraming(null);
    if (open) await upload(cut, open.field);
  };

  return {
    send,
    framing,
    cancelFrame: () => setFraming(null),
    applyFrame,
    saving,
    sending: uploadImage.isPending,
  };
}
