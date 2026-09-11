import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { reportGuild, type ReportGuildDto } from "~/@core/application/requests/guild/denunciar-guild";
import { apiErrorMessage } from "~/@core/lib/api";

export const useReportGuild = () =>
  useMutation({
    mutationFn: (data: ReportGuildDto) => reportGuild(data),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para enviar a denúncia.")),
  });
