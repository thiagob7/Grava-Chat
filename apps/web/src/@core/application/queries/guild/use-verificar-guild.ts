import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { verificarGuild, type VerificarGuildDTO } from "~/@core/application/requests/guild/verificar-guild";
import { apiErrorMessage } from "~/@core/lib/api";

export const useVerificarGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerificarGuildDTO) => verificarGuild(data),
    onSuccess: () => void queryClient.invalidateQueries(),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para mudar a verificação.")),
  });
};
