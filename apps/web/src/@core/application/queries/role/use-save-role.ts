import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createRole, type CreateRoleDTO } from "~/@core/application/requests/role/create-role";
import { updateRole, type UpdateRoleDTO } from "~/@core/application/requests/role/update-role";
import { deleteRole, type DeleteRoleDTO } from "~/@core/application/requests/role/delete-role";
import { reorderRoles, type ReorderRolesDTO } from "~/@core/application/requests/role/reorder-roles";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * Toda mudança de cargo mexe em duas coisas: a lista de cargos e o que cada
 * pessoa enxerga do servidor (um cargo sem VIEW_CHANNEL some canais). Por isso
 * as duas chaves caem juntas — invalidar só a de cargos deixaria a barra
 * lateral mostrando canal que a pessoa acabou de perder.
 */
function useInvalidarCargos(guildId: string | undefined) {
  const queryClient = useQueryClient();

  return () => {
    if (!guildId) return;
    void queryClient.invalidateQueries({ queryKey: queryKeys.role.find_many(guildId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
    void queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
  };
}

export const useCreateRole = (guildId: string | undefined) => {
  const invalidar = useInvalidarCargos(guildId);

  return useMutation({
    mutationFn: (data: CreateRoleDTO) => createRole(data),
    onSuccess: () => {
      invalidar();
      toast.success("Cargo criado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao criar o cargo.")),
  });
};

export const useUpdateRole = (guildId: string | undefined) => {
  const invalidar = useInvalidarCargos(guildId);

  return useMutation({
    mutationFn: (data: UpdateRoleDTO) => updateRole(data),
    onSuccess: () => {
      invalidar();
      toast.success("Cargo salvo.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao salvar o cargo.")),
  });
};

export const useDeleteRole = (guildId: string | undefined) => {
  const invalidar = useInvalidarCargos(guildId);

  return useMutation({
    mutationFn: (data: DeleteRoleDTO) => deleteRole(data),
    onSuccess: () => {
      invalidar();
      toast.success("Cargo apagado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao apagar o cargo.")),
  });
};

export const useReorderRoles = (guildId: string | undefined) => {
  const invalidar = useInvalidarCargos(guildId);

  return useMutation({
    mutationFn: (data: ReorderRolesDTO) => reorderRoles(data),
    onSuccess: invalidar,
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao reordenar os cargos.")),
  });
};
