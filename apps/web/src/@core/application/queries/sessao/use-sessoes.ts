import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { encerrarSessao, findSessoes } from "~/@core/application/requests/sessao/sessoes";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useSessoes = () =>
  useQuery({
    queryKey: [queryKeys.sessao.lista],
    queryFn: findSessoes,
    refetchOnWindowFocus: true,
  });

export const useEncerrarSessao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: encerrarSessao,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.sessao.lista] });
      toast.success("Aparelho desconectado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui desconectar.")),
  });
};
