import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createChannel } from "~/@core/application/requests/guild/create-channel";
import type { CreateChannelDTO } from "~/@core/domain/dtos/guild-dto";
import { apiErrorMessage } from "~/@core/lib/api";

export const useCreateChannel = () =>
  useMutation({
    mutationFn: (data: CreateChannelDTO) => createChannel(data),
    /**
     * Sem invalidate: o canal criado volta pelo evento `channel:created` — que
     * chega inclusive pra quem criou — e o handler de socket põe no cache.
     * Invalidar aqui refetcharia o servidor inteiro à toa.
     */
    onSuccess: () => {
      toast.success("Canal criado.");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Erro ao criar o canal."));
    },
  });
