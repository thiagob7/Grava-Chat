import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  responderPedidoDeDm,
  type AcaoDoPedido,
} from "~/@core/application/requests/friend/responder-pedido-de-dm";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useResponderPedidoDeDm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ channelId, acao }: { channelId: string; acao: AcaoDoPedido }) =>
      responderPedidoDeDm(channelId, acao),
    onSuccess: (_data, { acao }) => {
      if (acao === "aceitar") toast.success("Conversa aceita.");
      if (acao === "spam") toast.success("Marcado como spam.");

      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.pedidos] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.dms] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui responder o pedido."));
    },
  });
};
