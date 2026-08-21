import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { openDm } from "~/@core/application/requests/friend/open-dm";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useOpenDm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => openDm(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.friend.dms] });
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui abrir a conversa."));
    },
  });
};
