import { useState } from "react";
import type React from "react";

import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { formatBytes } from "~/lib/image";

const AVATAR_MAX_PX = 256;
const BANNER_MAX_PX = 640;

type Field = "avatarUrl" | "bannerUrl";

export function useImageProfileSending(
  set: (field: Field, url: string) => void,
) {
  const uploadImage = useUploadImage();
  const [saving, setSaving] = useState<string | null>(null);

  const send = async (event: React.ChangeEvent<HTMLInputElement>, field: Field) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

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

  return { send, saving, sending: uploadImage.isPending };
}
