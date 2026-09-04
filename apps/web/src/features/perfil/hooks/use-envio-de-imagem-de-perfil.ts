import { useState } from "react";
import type React from "react";

import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { formatBytes } from "~/lib/image";

const AVATAR_MAX_PX = 256;
const BANNER_MAX_PX = 640;

type Campo = "avatarUrl" | "bannerUrl";

export function useEnvioDeImagemDePerfil(
  definir: (campo: Campo, url: string) => void,
) {
  const uploadImage = useUploadImage();
  const [economia, setEconomia] = useState<string | null>(null);

  const enviar = async (event: React.ChangeEvent<HTMLInputElement>, campo: Campo) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const foto = campo === "avatarUrl";
    const resultado = await uploadImage
      .mutateAsync({
        file,
        maxSize: foto ? AVATAR_MAX_PX : BANNER_MAX_PX,
        finalidade: foto ? "avatar" : "banner",
      })
      .catch(() => null);

    if (!resultado) return;

    definir(campo, resultado.attachment.url);
    setEconomia(
      resultado.uploadedSize < resultado.originalSize
        ? `${formatBytes(resultado.originalSize)} → ${formatBytes(resultado.uploadedSize)}`
        : null,
    );
  };

  return { enviar, economia, enviando: uploadImage.isPending };
}
