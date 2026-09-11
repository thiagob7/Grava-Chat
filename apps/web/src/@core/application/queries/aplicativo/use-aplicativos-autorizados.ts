import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  findAppsAuthorized,
  revokeApp,
} from "~/@core/application/requests/aplicativo/aplicativos-autorizados";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useAppsAuthorized = () =>
  useQuery({
    queryKey: [queryKeys.app.authorized],
    queryFn: findAppsAuthorized,
    refetchOnWindowFocus: true,
  });

export const useRevokeApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeApp,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.app.authorized] });
      toast.success("Acesso revogado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui revogar o acesso.")),
  });
};
