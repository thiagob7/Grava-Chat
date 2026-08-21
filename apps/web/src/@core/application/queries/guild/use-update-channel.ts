import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  deleteChannel,
  updateChannel,
  type UpdateChannelDTO,
} from "~/@core/application/requests/guild/update-channel";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useUpdateChannel = (guildId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChannelDTO) => updateChannel(data),
    onSuccess: () => {
      // o evento channel:updated já corrige quem está com o servidor aberto;
      // isto é para quem disparou a mudança ver na hora
      if (guildId) void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
      toast.success("Canal salvo.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao salvar o canal.")),
  });
};

export const useDeleteChannel = (guildId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => {
      if (guildId) void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
      toast.success("Canal excluído.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao excluir o canal.")),
  });
};
