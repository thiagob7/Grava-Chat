import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  findExpressions,
  type ExpressionsModel,
} from "~/@core/application/requests/expression/find-expressions";
import {
  createEmoji,
  createSound,
  createSticker,
  deleteEmoji,
  deleteSound,
  deleteSticker,
  updateSound,
} from "~/@core/application/requests/expression/mutate-expressions";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

const EMPTY: ExpressionsModel = { emojis: [], stickers: [], sounds: [] };

export const useFindExpressions = (guildId: string | undefined) => {
  const query = useQuery({
    queryKey: queryKeys.expression.find_many(guildId ?? ""),
    queryFn: () => findExpressions(guildId!),
    enabled: Boolean(guildId),
    staleTime: 5 * 60_000,
  });

  return { ...query, data: query.data ?? EMPTY };
};

export const useFindExpressionsOf = (guildIds: string[], enabled = true) => {
  const results = useQueries({
    queries: guildIds.map((id) => ({
      queryKey: queryKeys.expression.find_many(id),
      queryFn: () => findExpressions(id),
      enabled,
      staleTime: 5 * 60_000,
    })),
  });

  return guildIds.map((guildId, i) => ({ guildId, data: results[i]?.data ?? EMPTY }));
};

function useInvalidate(guildId: string | undefined) {
  const queryClient = useQueryClient();

  return () => {
    if (guildId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expression.find_many(guildId) });
    }
  };
}

const error = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

export const useCreateEmoji = (guildId: string | undefined) => {
  const invalidate = useInvalidate(guildId);

  return useMutation({
    mutationFn: createEmoji,
    onSuccess: () => {
      invalidate();
      toast.success("Emoji adicionado.");
    },
    onError: error("Erro ao subir o emoji."),
  });
};

export const useDeleteEmoji = (guildId: string | undefined) => {
  const invalidate = useInvalidate(guildId);

  return useMutation({ mutationFn: deleteEmoji, onSuccess: invalidate, onError: error("Erro ao apagar.") });
};

export const useCreateSticker = (guildId: string | undefined) => {
  const invalidate = useInvalidate(guildId);

  return useMutation({
    mutationFn: createSticker,
    onSuccess: () => {
      invalidate();
      toast.success("Figurinha adicionada.");
    },
    onError: error("Erro ao subir a figurinha."),
  });
};

export const useDeleteSticker = (guildId: string | undefined) => {
  const invalidate = useInvalidate(guildId);

  return useMutation({ mutationFn: deleteSticker, onSuccess: invalidate, onError: error("Erro ao apagar.") });
};

export const useCreateSound = (guildId: string | undefined) => {
  const invalidate = useInvalidate(guildId);

  return useMutation({
    mutationFn: createSound,
    onSuccess: () => {
      invalidate();
      toast.success("Som adicionado.");
    },
    onError: error("Erro ao subir o som."),
  });
};

export const useUpdateSound = (guildId: string | undefined) => {
  const invalidate = useInvalidate(guildId);

  return useMutation({
    mutationFn: updateSound,
    onSuccess: invalidate,
    onError: error("Erro ao mudar o som."),
  });
};

export const useDeleteSound = (guildId: string | undefined) => {
  const invalidate = useInvalidate(guildId);

  return useMutation({ mutationFn: deleteSound, onSuccess: invalidate, onError: error("Erro ao apagar.") });
};
