import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ReadStateModel } from "~/@core/domain/models/message-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { ackMessage } from "~/@core/lib/websocket/emit-message-actions";

/**
 * Marca o canal como lido no servidor E no cache local.
 *
 * As duas coisas juntas de propósito: o servidor já marca como lido quando você
 * envia uma mensagem, mas sem atualizar o cache a bolinha de não-lido aparece
 * no canal em que você acabou de escrever.
 */
export const useMarkRead = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (channelId: string, messageId: string, { emit = true } = {}) => {
      queryClient.setQueryData([queryKeys.message.read_states], (old: ReadStateModel[] | undefined) => {
        const others = (old ?? []).filter((s) => s.channelId !== channelId);
        return [...others, { channelId, lastReadMessageId: messageId, unreadCount: 0, mentionCount: 0 }];
      });

      if (emit) void ackMessage(channelId, messageId).catch(() => undefined);
    },
    [queryClient],
  );
};
