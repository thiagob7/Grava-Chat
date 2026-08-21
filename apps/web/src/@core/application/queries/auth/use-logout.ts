import { useMutation, useQueryClient } from "@tanstack/react-query";

import { logout } from "~/@core/application/requests/auth/logout";

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Sessão encerrada: nada do cache anterior pode sobreviver.
      queryClient.clear();
    },
  });
};
