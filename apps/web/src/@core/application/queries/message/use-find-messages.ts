import { useInfiniteQuery } from "@tanstack/react-query";

import { findMessages } from "~/@core/application/requests/message/find-messages";
import type { MessagePageModel } from "~/@core/domain/models/message-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * Histórico paginado por cursor, do mais novo pro mais antigo.
 *
 * Cursor e não offset porque o feed cresce enquanto o usuário rola: com
 * skip/limit, mensagens novas empurram a janela e ele vê conteúdo repetido.
 * As mensagens novas entram por `setQueryData` no handler de socket, não por
 * refetch — daí `staleTime: Infinity`.
 */
export const useFindMessages = (channelId: string | undefined, postId?: string) =>
  useInfiniteQuery({
    // a conversa de um assunto do fórum tem cache próprio: é outra lista
    queryKey: postId
      ? queryKeys.channel.postMessages(postId)
      : queryKeys.channel.messages(channelId ?? ""),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      findMessages({ channelId: channelId!, before: pageParam, postId }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: MessagePageModel) =>
      lastPage.hasMore ? lastPage.messages[0]?.id : undefined,
    enabled: Boolean(channelId),
    staleTime: Infinity,
  });
