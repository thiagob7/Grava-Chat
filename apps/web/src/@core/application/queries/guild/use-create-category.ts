import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createCategory, type CreateCategoryDTO } from "~/@core/application/requests/guild/create-category";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDTO) => createCategory(data),
    onSuccess: (_category, { guildId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
      toast.success("Categoria criada.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para criar a categoria.")),
  });
};
