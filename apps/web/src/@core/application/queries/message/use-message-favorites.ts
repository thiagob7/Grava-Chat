import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  findFavoriteMessageIds,
  findFavoriteMessages,
  toggleFavoriteMessage,
} from "~/@core/application/requests/message/favorites";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * Só os ids, para a estrela saber se está acesa. É o que fica carregado o
 * tempo todo; a lista com as mensagens inteiras só é buscada quando o painel
 * de favoritas abre.
 */
export const useFavoriteMessageIds = () =>
  useQuery({
    queryKey: [queryKeys.message.favorite_ids],
    queryFn: findFavoriteMessageIds,
    staleTime: 5 * 60_000,
  });

export const useFavoriteMessages = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.favorites],
    queryFn: findFavoriteMessages,
    enabled,
    staleTime: 60_000,
  });

export const useToggleFavoriteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, favorita }: { messageId: string; favorita: boolean }) =>
      toggleFavoriteMessage(messageId, !favorita),

    onSuccess: (ids) => {
      queryClient.setQueryData([queryKeys.message.favorite_ids], ids);
      void queryClient.invalidateQueries({ queryKey: [queryKeys.message.favorites] });
    },

    onError: (e) => toast.error(apiErrorMessage(e, "Não deu pra salvar essa mensagem.")),
  });
};
