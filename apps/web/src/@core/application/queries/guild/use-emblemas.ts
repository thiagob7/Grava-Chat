import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  createBadge,
  removeBadge,
  wearBadges,
} from "~/@core/application/requests/guild/emblemas";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

const useBadgeMutation = <T,>(guildId: string, fn: (v: T) => Promise<unknown>, error: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
    },
    onError: (e) => toast.error(apiErrorMessage(e, error)),
  });
};

export const useCreateBadge = (guildId: string) =>
  useBadgeMutation(
    guildId,
    (data: { name: string; emoji?: string | null; iconUrl?: string | null }) =>
      createBadge(guildId, data),
    "Não consegui criar o emblema.",
  );

export const useRemoveBadge = (guildId: string) =>
  useBadgeMutation(
    guildId,
    (badgeId: string) => removeBadge(guildId, badgeId),
    "Não consegui apagar o emblema.",
  );

export const useWearBadges = (guildId: string) =>
  useBadgeMutation(
    guildId,
    (emblemIds: string[]) => wearBadges(guildId, emblemIds),
    "Não consegui salvar seus emblemas.",
  );
