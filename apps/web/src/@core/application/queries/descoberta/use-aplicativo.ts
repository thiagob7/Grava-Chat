import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  reportApp,
  findApp,
} from "~/@core/application/requests/descoberta/descoberta";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { i18next } from "~/traducao";

export const useApp = (botId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.discovery.app(botId ?? ""),
    queryFn: () => findApp(botId!),
    enabled: Boolean(botId),
    retry: false,
  });

export const useReportApp = (botId: string) =>
  useMutation({
    mutationFn: (data: { reason: string; details?: string }) =>
      reportApp(botId, data),
    onSuccess: () => toast.success(i18next.t("servidor.denuncia.enviada")),
    onError: () => toast.error(i18next.t("servidor.descoberta.denunciaFalhou")),
  });
