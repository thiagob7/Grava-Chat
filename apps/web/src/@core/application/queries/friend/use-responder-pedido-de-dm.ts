import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  dmReplyRequest,
  type RequestAction,
} from "~/@core/application/requests/friend/responder-pedido-de-dm";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useDmReplyRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, action }: { channelId: string; action: RequestAction }) =>
      dmReplyRequest(channelId, action),
    onSuccess: (_data, { action }) => {
      if (action === "aceitar") toast.success("Conversa aceita.");
      if (action === "spam") toast.success("Marcado como spam.");

      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.requests] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.dms] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui responder o pedido."));
    },
  });
};
