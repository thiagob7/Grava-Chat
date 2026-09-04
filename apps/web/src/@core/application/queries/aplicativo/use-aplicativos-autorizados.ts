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
