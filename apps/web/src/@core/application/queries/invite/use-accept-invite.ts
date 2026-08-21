import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { acceptInvite } from "~/@core/application/requests/invite/accept-invite";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useAcceptInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => acceptInvite(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não foi possível entrar no servidor."));
    },
  });
};
