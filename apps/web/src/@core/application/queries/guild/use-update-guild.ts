import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { updateGuild, type UpdateGuildDTO } from "~/@core/application/requests/guild/update-guild";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useUpdateGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGuildDTO) => updateGuild(data),
    onSuccess: (_, data) => {
      toast.success("Servidor atualizado.");
      queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
      queryClient.invalidateQueries({ queryKey: queryKeys.guild.detail(data.guildId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.guild.community(data.guildId) });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao salvar o servidor.")),
  });
};
