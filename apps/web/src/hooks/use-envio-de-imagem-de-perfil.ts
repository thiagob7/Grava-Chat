import { useState } from "react";
import type React from "react";

import { useUploadImage } from "~/@core/application/queries/upload/use-upload-image";
import { formatBytes } from "~/lib/image";

/*
  Envio da foto e da faixa do perfil. Vive num hook porque acontece em dois
  lugares: na coluna de campos e no próprio cartão, onde dá pra clicar no
  avatar e na faixa pra trocar — como no Discord. Duplicar essa lógica era
  convite pros dois caminhos divergirem no limite de tamanho ou na finalidade.
*/
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
    /// Zerar antes de sair: sem isso, escolher o MESMO arquivo de novo não
    /// dispara `change` e a troca parece ter sido ignorada.
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
