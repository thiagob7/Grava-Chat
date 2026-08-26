import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Attachment } from "@gravae/shared";
import type {
  MessagePageModel,
  PendingMessageModel,
  ReadStateModel,
} from "~/@core/domain/models/message-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import type { CreatePollInput } from "@gravae/shared";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { sendMessage } from "~/@core/lib/websocket/send-message";

interface SendMessageVariables {
  channelId: string;
  content: string;
  replyToId?: string | null;
  attachments?: Attachment[];
  stickerId?: string;
  poll?: CreatePollInput;
  postId?: string | null;
}

type MessagesCache = { pages: MessagePageModel[]; pageParams: unknown[] } | undefined;

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: SendMessageVariables & { nonce: string }) => sendMessage(variables),

    onMutate: async (variables) => {
      const me = queryClient.getQueryData<SelfUserModel>([queryKeys.auth.me]);
      if (!me) return;

      const optimistic: PendingMessageModel = {
        id: `pending-${variables.nonce}`,
        channelId: variables.channelId,
        author: me,
        content: variables.content,
        tipo: "USER",
        attachments: variables.attachments ?? [],
        poll: null,
        sticker: null,
        reactions: [],
        mentions: [],
        mentionRoleIds: [],
        mentionEveryone: false,
        replyToId: variables.replyToId ?? null,
        postId: variables.postId ?? null,
        pinnedAt: null,
        createdAt: new Date().toISOString(),
        editedAt: null,
        pending: true,
        nonce: variables.nonce,
      };

      queryClient.setQueryData(queryKeys.channel.messages(variables.channelId), (old: MessagesCache) => {
        if (!old?.pages.length) return old;

        const [newest, ...rest] = old.pages;
        if (!newest) return old;

        return { ...old, pages: [{ ...newest, messages: [...newest.messages, optimistic] }, ...rest] };
      });
    },

    onSuccess: (result, variables) => {
      const id = (result as { id?: string } | null)?.id;
      if (!id) return;

      queryClient.setQueryData([queryKeys.message.read_states], (old: ReadStateModel[] | undefined) => {
        const anterior = (old ?? []).find((s) => s.channelId === variables.channelId);
        const others = (old ?? []).filter((s) => s.channelId !== variables.channelId);

        return [
          ...others,
          {
            channelId: variables.channelId,
            guildId: anterior?.guildId ?? null,
            lastReadMessageId: id,
            unreadCount: 0,
            mentionCount: 0,
          },
        ];
      });
    },

    onError: (_error, variables) => {
      queryClient.setQueryData(queryKeys.channel.messages(variables.channelId), (old: MessagesCache) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              (m as PendingMessageModel).nonce === variables.nonce
                ? { ...m, pending: undefined, failed: true }
                : m,
            ),
          })),
        };
      });
    },
  });
};
