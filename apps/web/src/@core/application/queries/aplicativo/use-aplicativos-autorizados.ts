import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  findAplicativosAutorizados,
  revogarAplicativo,
} from "~/@core/application/requests/aplicativo/aplicativos-autorizados";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useAplicativosAutorizados = () =>
  useQuery({
    queryKey: [queryKeys.aplicativo.autorizados],
    queryFn: findAplicativosAutorizados,
    /// Um token pode ter vencido enquanto a aba estava de lado, e a lista poda
    /// os vencidos no servidor a cada consulta — voltar pra aba é a hora certa.
    refetchOnWindowFocus: true,
  });

export const useRevogarAplicativo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revogarAplicativo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.aplicativo.autorizados] });
      toast.success("Acesso revogado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui revogar o acesso.")),
  });
};
