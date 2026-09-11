import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { requestFriend } from "~/@core/application/requests/friend/request-friend";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useRequestFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: string | { username: string; note?: string | null }) =>
      typeof entry === "string"
        ? requestFriend(entry)
        : requestFriend(entry.username, entry.note),
    onSuccess: ({ accepted }) => {
      toast.success(accepted ? "Vocês agora são amigos!" : "Pedido de amizade enviado.");
      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.find_many] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui enviar o pedido."));
    },
  });
};
