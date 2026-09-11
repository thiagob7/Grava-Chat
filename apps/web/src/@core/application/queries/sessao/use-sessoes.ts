import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { endSession, findSessions } from "~/@core/application/requests/sessao/sessoes";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useSessions = () =>
  useQuery({
    queryKey: [queryKeys.session.list],
    queryFn: findSessions,
    refetchOnWindowFocus: true,
  });

export const useEndSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [queryKeys.session.list] });
      toast.success("Aparelho desconectado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui desconectar.")),
  });
};
