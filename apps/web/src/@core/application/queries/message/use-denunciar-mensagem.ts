import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  reportMessage,
  type ReportMessageDto,
} from "~/@core/application/requests/message/denunciar-mensagem";
import { apiErrorMessage } from "~/@core/lib/api";

export const useReportMessage = () =>
  useMutation({
    mutationFn: (data: ReportMessageDto) => reportMessage(data),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para enviar a denúncia.")),
  });
