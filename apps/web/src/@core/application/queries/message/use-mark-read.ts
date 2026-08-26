import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ReadStateModel } from "~/@core/domain/models/message-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { ackMessage } from "~/@core/lib/websocket/emit-message-actions";

export const useMarkRead = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (channelId: string, messageId: string, { emit = true } = {}) => {
      queryClient.setQueryData([queryKeys.message.read_states], (old: ReadStateModel[] | undefined) => {
        const anterior = (old ?? []).find((s) => s.channelId === channelId);
        const others = (old ?? []).filter((s) => s.channelId !== channelId);

        return [
          ...others,
          {
            channelId,
            guildId: anterior?.guildId ?? null,
            lastReadMessageId: messageId,
            unreadCount: 0,
            mentionCount: 0,
          },
        ];
      });

      if (emit) void ackMessage(channelId, messageId).catch(() => undefined);
    },
    [queryClient],
  );
};
