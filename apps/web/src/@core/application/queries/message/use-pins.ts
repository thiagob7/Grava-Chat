import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { findPins, pinMessage } from "~/@core/application/requests/message/pins";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindPins = (channelId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.channel.pins(channelId ?? ""),
    queryFn: () => findPins(channelId!),
    enabled: Boolean(channelId) && enabled,
  });

export const usePinMessage = (channelId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pinMessage,
    onSuccess: (_, variaveis) => {
      if (channelId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.channel.pins(channelId) });
      }
      toast.success(variaveis.pin ? "Mensagem fixada." : "Mensagem desafixada.");
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Erro ao fixar a mensagem.")),
  });
};
