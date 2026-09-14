import { useState } from "react";
import type React from "react";

import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { toast } from "react-toastify";

import { importImage } from "~/@core/application/requests/upload/importar-imagem";
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

export function useImageProfileSending(
  set: (field: Field, url: string) => void,
) {
  const uploadImage = useUploadImage();
  const [saving, setSaving] = useState<string | null>(null);
  const [framing, setFraming] = useState<ProfileImageFrame | null>(null);
  const [chooserField, setChooserField] = useState<Field | null>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [fetchingGif, setFetchingGif] = useState(false);

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

  const sendFile = (file: File, field: Field) => {
    if (!file.type.startsWith("image/")) return;

    const photo = field === "avatarUrl";
    setFraming({
      file,
      field,
      aspect: photo ? AVATAR_ASPECT : BANNER_ASPECT,
      exportWidth: photo ? AVATAR_MAX_PX : BANNER_MAX_PX,
    });
  };

  const send = async (event: React.ChangeEvent<HTMLInputElement>, field: Field) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) sendFile(file, field);
  };

  const sendGif = async (url: string, field: Field) => {
    setFetchingGif(true);
    const file = await fetch(url)
      .then((reply) => (reply.ok ? reply.blob() : Promise.reject()))
      .then((blob) => new File([blob], "klipy.gif", { type: blob.type || "image/gif" }))
      .catch(() => null)
      .finally(() => setFetchingGif(false));

    if (file) {
      sendFile(file, field);
      return;
    }

    setFetchingGif(true);
    const attachment = await importImage(url, field === "avatarUrl" ? "avatar" : "banner")
      .catch(() => {
        toast.error("Não consegui trazer esse GIF.");
        return null;
      })
      .finally(() => setFetchingGif(false));

    if (attachment) set(field, attachment.url);
  };

  const applyFrame = async (cut: File) => {
    const open = framing;
    setFraming(null);
    if (open) await upload(cut, open.field);
  };

  const skipFrame = async () => {
    const open = framing;
    setFraming(null);
    if (open) await upload(open.file, open.field);
  };

  return {
    send,
    sendFile,
    sendGif,
    framing,
    cancelFrame: () => setFraming(null),
    applyFrame,
    skipFrame,
    saving,
    sending: uploadImage.isPending || fetchingGif,
    chooserField,
    chooserOpen,
    choose: (field: Field) => {
      setChooserField(field);
      setChooserOpen(true);
    },
    closeChooser: () => setChooserOpen(false),
  };
}

export type ProfileImageSending = ReturnType<typeof useImageProfileSending>;
