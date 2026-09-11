import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  setChannelStatus,
  type ChannelDtoStatus,
} from "~/@core/application/requests/guild/status-do-canal";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useSetChannelStatus = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: ChannelDtoStatus) => setChannelStatus(data),
    onSuccess: (_channel, { guildId }) =>
      void client.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) }),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para mudar o status.")),
  });
};
