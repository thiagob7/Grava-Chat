import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  setMemberRoles,
  type SetMemberRolesDTO,
} from "~/@core/application/requests/role/set-member-roles";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useSetMemberRoles = (guildId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetMemberRolesDTO) => setMemberRoles(data),
    onSuccess: () => {
      if (!guildId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.role.find_many(guildId) });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao mudar os cargos.")),
  });
};
