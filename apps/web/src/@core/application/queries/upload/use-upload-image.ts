import { useMutation } from "@tanstack/react-query";
import type { UploadPurpose } from "@gravae/shared";
import { toast } from "react-toastify";

import { apiErrorMessage } from "~/@core/lib/api";
import { uploadImage } from "~/lib/upload";

interface UploadImageVariables {
  file: File;
  maxSize: number;
  purpose?: UploadPurpose;
}

export const useUploadImage = () =>
  useMutation({
    mutationFn: ({ file, maxSize, purpose }: UploadImageVariables) =>
      uploadImage(file, { maxSize, purpose }),
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui enviar a imagem."));
    },
  });
