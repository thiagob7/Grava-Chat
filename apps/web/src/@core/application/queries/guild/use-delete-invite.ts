import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { deleteInvite } from "~/@core/application/requests/guild/delete-invite";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useDeleteInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { guildId: string; inviteId: string }) => deleteInvite(data),
    onSuccess: (_r, { guildId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guild.invites(guildId) });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao revogar o convite.")),
  });
};
