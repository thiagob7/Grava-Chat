import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { cancelarExclusao, pedirExclusao } from "~/@core/application/requests/conta/exclusao";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const usePedirExclusao = () =>
  useMutation({
    mutationFn: pedirExclusao,
    /*
      Recarrega a página inteira em vez de mexer no cache.

      O pedido derrubou as sessões no servidor: o token que este app tem na mão
      já não vale, e qualquer consulta seguinte voltaria 401 em cascata. Começar
      do zero é o caminho honesto — a pessoa cai na tela de recuperação, que é
      exatamente onde ela deve estar.
    */
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
