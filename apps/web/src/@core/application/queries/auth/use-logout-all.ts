import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { logoutAll } from "~/@core/application/requests/auth/logout";

export const useLogoutAll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutAll,
    onSuccess: () => {
      queryClient.clear();
      toast.info("Todas as sessões foram encerradas.");
    },
  });
};
