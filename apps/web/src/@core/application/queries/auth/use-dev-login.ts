import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { devLogin } from "~/@core/application/requests/auth/dev-login";
import type { DevLoginDTO } from "~/@core/domain/dtos/auth-dto";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useDevLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DevLoginDTO) => devLogin(data),
    onSuccess: (session) => {
      queryClient.setQueryData([queryKeys.auth.me], session.user);
      queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não foi possível entrar."));
    },
  });
};
