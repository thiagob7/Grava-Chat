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

/**
 * As expressões de vários servidores de uma vez — é o que o seletor precisa
 * para mostrar os emojis de todos os seus servidores, e não só os do que está
 * aberto.
 *
 * Usa a mesma `queryKey` do `useFindExpressions`, então o servidor que já
 * estava carregado sai do cache sem nova ida à rede.
 */
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

/**
 * Sem aviso de sucesso: quem mexe no volume mexe arrastando, e um brinde a
 * cada solta do dedo empilharia cinco avisos na tela. A lista se atualiza
 * sozinha, que é a confirmação que importa.
 */
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
