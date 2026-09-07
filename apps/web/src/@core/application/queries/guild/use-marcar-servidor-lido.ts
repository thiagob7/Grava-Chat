import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { marcarServidorLido } from "~/@core/application/requests/guild/marcar-servidor-lido";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useMarcarServidorLido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guildId: string) => marcarServidorLido(guildId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [queryKeys.message.read_states] }),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para marcar como lido.")),
  });
};
