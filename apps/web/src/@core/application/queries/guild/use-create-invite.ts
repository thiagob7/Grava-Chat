import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createInvite } from "~/@core/application/requests/guild/create-invite";
import type { CreateInviteDTO } from "~/@core/domain/dtos/guild-dto";
import { apiErrorMessage } from "~/@core/lib/api";

export const useCreateInvite = () =>
  useMutation({
    mutationFn: (data: CreateInviteDTO) => createInvite(data),
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Erro ao gerar o convite."));
    },
  });
