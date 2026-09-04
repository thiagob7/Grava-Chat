import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { cancelarExclusao, pedirExclusao } from "~/@core/application/requests/conta/exclusao";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const usePedirExclusao = () =>
  useMutation({
    mutationFn: pedirExclusao,
    onSuccess: () => window.location.reload(),
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui excluir a conta.")),
  });

export const useCancelarExclusao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelarExclusao,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.auth.me] });
      toast.success("Conta recuperada. Nada tinha sido apagado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui recuperar a conta.")),
  });
};
