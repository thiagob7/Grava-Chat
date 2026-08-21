import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { updateGuild, type UpdateGuildDTO } from "~/@core/application/requests/guild/update-guild";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useUpdateGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateGuildDTO) => updateGuild(data),
    onSuccess: () => {
      toast.success("Servidor atualizado.");
      // o evento guild:updated já atualiza quem está com o servidor aberto;
      // isto é para a lista lateral de quem disparou a mudança
      queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao salvar o servidor.")),
  });
};
