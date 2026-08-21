import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { respondFriend } from "~/@core/application/requests/friend/respond-friend";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useRespondFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId, accept }: { friendshipId: string; accept: boolean }) =>
      respondFriend(friendshipId, accept),
    onSuccess: (_data, { accept }) => {
      if (accept) toast.success("Pedido aceito!");
      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.find_many] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui responder o pedido."));
    },
  });
};
