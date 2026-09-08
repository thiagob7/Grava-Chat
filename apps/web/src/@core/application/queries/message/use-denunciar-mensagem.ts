import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  denunciarMensagem,
  type DenunciarMensagemDTO,
} from "~/@core/application/requests/message/denunciar-mensagem";
import { apiErrorMessage } from "~/@core/lib/api";

export const useDenunciarMensagem = () =>
  useMutation({
    mutationFn: (data: DenunciarMensagemDTO) => denunciarMensagem(data),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para enviar a denúncia.")),
  });
