import { useMutation } from "@tanstack/react-query";
import type { FinalidadeDeUpload } from "@gravae/shared";
import { toast } from "react-toastify";

import { apiErrorMessage } from "~/@core/lib/api";
import { uploadImage } from "~/lib/upload";

interface UploadImageVariables {
  file: File;
  maxSize: number;
  finalidade?: FinalidadeDeUpload;
}

export const useUploadImage = () =>
  useMutation({
    mutationFn: ({ file, maxSize, finalidade }: UploadImageVariables) =>
      uploadImage(file, { maxSize, finalidade }),
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui enviar a imagem."));
    },
  });
