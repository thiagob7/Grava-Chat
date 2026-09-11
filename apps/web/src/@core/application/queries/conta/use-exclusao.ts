import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { cancelDeletion, requestDeletion } from "~/@core/application/requests/conta/exclusao";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useRequestDeletion = () =>
  useMutation({
    mutationFn: requestDeletion,
    onSuccess: () => window.location.reload(),
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui excluir a conta.")),
  });

export const useCancelDeletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelDeletion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.auth.me] });
      toast.success("Conta recuperada. Nada tinha sido apagado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui recuperar a conta.")),
  });
};
