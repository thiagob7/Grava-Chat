import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { salvarNota } from "~/@core/application/requests/user/salvar-nota";
import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useSalvarNota = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (texto: string) => salvarNota(userId, texto),
    /**
     * Escreve no cache em vez de invalidar: a nota é gravada ao sair do campo,
     * e um refetch aqui piscaria o cartão inteiro por causa de uma linha de
     * texto que já está na tela.
     */
    onSuccess: ({ nota }) => {
      queryClient.setQueryData(queryKeys.user.profile(userId), (antigo?: ProfileModel) =>
        antigo ? { ...antigo, nota } : antigo,
      );
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui salvar a nota."));
    },
  });
};
