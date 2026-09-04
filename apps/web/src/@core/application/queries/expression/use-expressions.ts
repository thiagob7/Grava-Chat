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

const VAZIO: ExpressionsModel = { emojis: [], stickers: [], sounds: [] };

export const useFindExpressions = (guildId: string | undefined) => {
  const query = useQuery({
    queryKey: queryKeys.expression.find_many(guildId ?? ""),
    queryFn: () => findExpressions(guildId!),
    enabled: Boolean(guildId),
    staleTime: 5 * 60_000,
  });

  return { ...query, data: query.data ?? VAZIO };
};

export const useFindExpressionsOf = (guildIds: string[], enabled = true) => {
  const resultados = useQueries({
    queries: guildIds.map((id) => ({
      queryKey: queryKeys.expression.find_many(id),
      queryFn: () => findExpressions(id),
      enabled,
      staleTime: 5 * 60_000,
    })),
  });

  return guildIds.map((guildId, i) => ({ guildId, data: resultados[i]?.data ?? VAZIO }));
};

function useInvalidar(guildId: string | undefined) {
  const queryClient = useQueryClient();

  return () => {
    if (guildId) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.expression.find_many(guildId) });
    }
  };
}

const erro = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

export const useCreateEmoji = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({
    mutationFn: createEmoji,
    onSuccess: () => {
      invalidar();
      toast.success("Emoji adicionado.");
    },
    onError: erro("Erro ao subir o emoji."),
  });
};

export const useDeleteEmoji = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({ mutationFn: deleteEmoji, onSuccess: invalidar, onError: erro("Erro ao apagar.") });
};

export const useCreateSticker = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({
    mutationFn: createSticker,
    onSuccess: () => {
      invalidar();
      toast.success("Figurinha adicionada.");
    },
    onError: erro("Erro ao subir a figurinha."),
  });
};

export const useDeleteSticker = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({ mutationFn: deleteSticker, onSuccess: invalidar, onError: erro("Erro ao apagar.") });
};

export const useCreateSound = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({
    mutationFn: createSound,
    onSuccess: () => {
      invalidar();
      toast.success("Som adicionado.");
    },
    onError: erro("Erro ao subir o som."),
  });
};

export const useUpdateSound = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({
    mutationFn: updateSound,
    onSuccess: invalidar,
    onError: erro("Erro ao mudar o som."),
  });
};

export const useDeleteSound = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({ mutationFn: deleteSound, onSuccess: invalidar, onError: erro("Erro ao apagar.") });
};
