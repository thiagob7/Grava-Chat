import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { CommunitySettings } from "@gravae/shared";

import {
  adjustCommunity,
  findCommunity,
  enableCommunity,
  type CommunityEntry,
} from "~/@core/application/requests/guild/comunidade";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { i18next } from "~/traducao";

export const useCommunity = (guildId: string, active = true) =>
  useQuery({
    queryKey: queryKeys.guild.community(guildId),
    queryFn: () => findCommunity(guildId),
    enabled: active && Boolean(guildId),
    retry: false,
  });

export const useEnableCommunity = (guildId: string) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: CommunityEntry) => enableCommunity(guildId, data),
    onSuccess: (state) => {
      client.setQueryData(queryKeys.guild.community(guildId), state);
      void client.invalidateQueries({ queryKey: queryKeys.guild.detail(guildId) });
      toast.success(i18next.t("servidor.comunidade.habilitada"));
    },
    onError: () => toast.error(i18next.t("servidor.comunidade.falhou")),
  });
};

export const useAdjustCommunity = (guildId: string) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CommunitySettings>) => adjustCommunity(guildId, data),
    onSuccess: (state) => client.setQueryData(queryKeys.guild.community(guildId), state),
    onError: () => toast.error(i18next.t("servidor.comunidade.falhou")),
  });
};
