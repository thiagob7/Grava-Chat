import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { updateProfile } from "~/@core/application/requests/auth/update-profile";
import type { UpdateProfileDTO } from "~/@core/domain/dtos/auth-dto";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileDTO) => updateProfile(data),
    onSuccess: (user) => {
      queryClient.setQueryData([queryKeys.auth.me], user);
      // o nome e a foto aparecem na lista de membros de cada servidor
      queryClient.invalidateQueries({ queryKey: ["find-guild"] });
      toast.success("Perfil atualizado.");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Erro ao salvar o perfil."));
    },
  });
};
