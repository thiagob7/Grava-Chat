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
  /** figurinha do servidor: a mensagem é só ela */
  stickerId?: string;
  /** enquete criada junto com a mensagem */
  poll?: CreatePollInput;
  /** resposta dentro de um assunto do fórum */
  postId?: string | null;
}

type MessagesCache = { pages: MessagePageModel[]; pageParams: unknown[] } | undefined;

/**
 * Envio otimista: a mensagem aparece na hora com um id temporário e um nonce.
 * Quando o evento `message:created` volta com o mesmo nonce, o handler de
 * socket substitui a temporária pela real — sem piscar e sem duplicar.
 *
 * O envio vai por WebSocket, não por HTTP: a mensagem já precisa ser
 * distribuída pra sala inteira, e um POST faria a viagem duas vezes.
 */
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
        // já subiram quando o arquivo foi escolhido, então a prévia otimista
        // mostra a imagem de verdade e não um placeholder
        attachments: variables.attachments ?? [],
        poll: null,
        sticker: null,
        reactions: [],
        /**
         * A menção otimista fica vazia de propósito: quem decide o que pinga de
         * verdade é o servidor (cargo mencionável, `MENTION_EVERYONE`), e a
         * mensagem real chega logo em seguida pelo socket com a resposta dele.
         * Adivinhar aqui só criaria um piscar de destaque que some.
         */
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
      // O servidor marca como lido ao enviar; o cache precisa acompanhar,
      // senão a bolinha de não-lido acende no canal em que você escreveu.
      const id = (result as { id?: string } | null)?.id;
      if (!id) return;

      queryClient.setQueryData([queryKeys.message.read_states], (old: ReadStateModel[] | undefined) => {
        const others = (old ?? []).filter((s) => s.channelId !== variables.channelId);
        return [
          ...others,
          { channelId: variables.channelId, lastReadMessageId: id, unreadCount: 0, mentionCount: 0 },
        ];
      });
    },

    onError: (_error, variables) => {
      // Marca como falha em vez de sumir: o usuário perde o texto se removermos.
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
