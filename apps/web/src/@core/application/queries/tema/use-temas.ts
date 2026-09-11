import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  deleteTheme,
  findMineThemes,
  findTheme,
  publishTheme,
} from "~/@core/application/requests/tema/temas";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useTheme = (themeId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.theme.find(themeId ?? ""),
    queryFn: () => findTheme(themeId!),
    enabled: Boolean(themeId),
    retry: false,
  });

export const useMineThemes = (enabled: boolean) =>
  useQuery({ queryKey: [queryKeys.theme.mine], queryFn: findMineThemes, enabled });

export const usePublishTheme = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: publishTheme,
    onSuccess: () => void client.invalidateQueries({ queryKey: [queryKeys.theme.mine] }),
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui publicar o tema.")),
  });
};

export const useDeleteTheme = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: deleteTheme,
    onSuccess: () => {
      toast.success("Tema apagado. O link parou de valer.");
      void client.invalidateQueries({ queryKey: [queryKeys.theme.mine] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não consegui apagar o tema.")),
  });
};
