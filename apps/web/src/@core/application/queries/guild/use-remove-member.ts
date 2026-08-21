import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { removeMember } from "~/@core/application/requests/guild/remove-member";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/** Serve para expulsar alguém e para sair do servidor (mesma rota). */
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { guildId: string; userId: string }) => removeMember(data),
    onSuccess: (_r, { guildId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
      queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível remover.")),
  });
};
