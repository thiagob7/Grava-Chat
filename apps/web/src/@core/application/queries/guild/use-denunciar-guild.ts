import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { denunciarGuild, type DenunciarGuildDTO } from "~/@core/application/requests/guild/denunciar-guild";
import { apiErrorMessage } from "~/@core/lib/api";

export const useDenunciarGuild = () =>
  useMutation({
    mutationFn: (data: DenunciarGuildDTO) => denunciarGuild(data),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para enviar a denúncia.")),
  });
