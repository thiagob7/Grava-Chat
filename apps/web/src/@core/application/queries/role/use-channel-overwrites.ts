import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { findChannelOverwrites } from "~/@core/application/requests/role/find-channel-overwrites";
import {
  setChannelOverwrite,
  type SetChannelOverwriteDTO,
} from "~/@core/application/requests/role/set-channel-overwrite";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindChannelOverwrites = (
  guildId: string | undefined,
  channelId: string | undefined,
) =>
  useQuery({
    queryKey: queryKeys.role.overwrites(channelId ?? ""),
    queryFn: () => findChannelOverwrites(guildId!, channelId!),
    enabled: Boolean(guildId && channelId),
  });

export const useSetChannelOverwrite = (guildId: string | undefined, channelId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetChannelOverwriteDTO) => setChannelOverwrite(data),
    onSuccess: () => {
      if (channelId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.role.overwrites(channelId) });
      }
      // pode ter tirado o canal da própria vista de quem editou
      if (guildId) void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao salvar as permissões.")),
  });
};
