import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { verifyGuild, type VerifyGuildDto } from "~/@core/application/requests/guild/verificar-guild";
import { apiErrorMessage } from "~/@core/lib/api";

export const useVerifyGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VerifyGuildDto) => verifyGuild(data),
    onSuccess: () => void queryClient.invalidateQueries(),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para mudar a verificação.")),
  });
};
