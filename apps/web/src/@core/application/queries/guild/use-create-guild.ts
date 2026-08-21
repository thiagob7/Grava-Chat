import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createGuild } from "~/@core/application/requests/guild/create-guild";
import type { CreateGuildDTO } from "~/@core/domain/dtos/guild-dto";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useCreateGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGuildDTO) => createGuild(data),
    onSuccess: () => {
      toast.success("Servidor criado.");
      queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Erro ao criar o servidor."));
    },
  });
};
