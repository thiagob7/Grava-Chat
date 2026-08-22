import { useMutation } from "@tanstack/react-query";
import type { FinalidadeDeUpload } from "@gravae/shared";
import { toast } from "react-toastify";

import { apiErrorMessage } from "~/@core/lib/api";
import { uploadImage } from "~/lib/upload";

interface UploadImageVariables {
  file: File;
  /** maior lado, em pixels, depois do redimensionamento */
  maxSize: number;
  /** escolhe o teto de bytes no servidor; ausente = anexo */
  finalidade?: FinalidadeDeUpload;
}

/**
 * Comprime no navegador, pede a URL assinada e envia direto pro R2.
 * O binário nunca passa pela API.
 */
export const useUploadImage = () =>
  useMutation({
    mutationFn: ({ file, maxSize, finalidade }: UploadImageVariables) =>
      uploadImage(file, { maxSize, finalidade }),
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui enviar a imagem."));
    },
  });
