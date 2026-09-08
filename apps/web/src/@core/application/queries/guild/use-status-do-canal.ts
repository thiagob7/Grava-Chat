import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  definirStatusDoCanal,
  type StatusDoCanalDTO,
} from "~/@core/application/requests/guild/status-do-canal";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useDefinirStatusDoCanal = () => {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: (data: StatusDoCanalDTO) => definirStatusDoCanal(data),
    onSuccess: (_canal, { guildId }) =>
      void cliente.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) }),
    onError: (erro) => toast.error(apiErrorMessage(erro, "Não deu para mudar o status.")),
  });
};
