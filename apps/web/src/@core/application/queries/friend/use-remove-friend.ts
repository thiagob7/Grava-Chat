import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { removeFriend } from "~/@core/application/requests/friend/remove-friend";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendshipId: string) => removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.find_many] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.dms] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui remover."));
    },
  });
};
