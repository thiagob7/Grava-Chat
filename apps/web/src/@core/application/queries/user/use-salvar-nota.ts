import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { saveNote } from "~/@core/application/requests/user/salvar-nota";
import type { ProfileModel } from "~/@core/domain/models/profile-model";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useSaveNote = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => saveNote(userId, text),
    onSuccess: ({ note }) => {
      queryClient.setQueryData(queryKeys.user.profile(userId), (old?: ProfileModel) =>
        old ? { ...old, note } : old,
      );
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Não consegui salvar a nota."));
    },
  });
};
