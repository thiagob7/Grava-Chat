import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { deleteGuild } from "~/@core/application/requests/guild/delete-guild";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useDeleteGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guildId: string) => deleteGuild(guildId),
    onSuccess: () => {
      toast.success("Servidor excluído.");
      queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao excluir o servidor.")),
  });
};
