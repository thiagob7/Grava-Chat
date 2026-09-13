import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { conversationOnDisk } from "~/@core/infra/cache/conversa-no-disco";
import { findMessages } from "~/@core/application/requests/message/find-messages";
import type { MessagePageModel } from "~/@core/domain/models/message-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/*
  Pinta a conversa do disco enquanto a rede não responde.

  A busca de mensagens continua exatamente a mesma: ela dispara na montagem e,
  quando chega, manda no que estiver na tela. O que muda é o intervalo entre a
  janela abrir e a resposta chegar, que hoje é esqueleto e passa a ser a
  conversa como ela estava.

  Duas guardas fazem isto ser seguro. A primeira é só semear quando NÃO existe
  dado: se a rede chegou antes, não se toca em nada. A segunda é conferir de
  novo depois da leitura do disco, porque entre pedir e receber a resposta da
  API pode ter entrado — e aí o disco chegou tarde e cala a boca.

  Não é preciso forçar recarga: a busca da rede já está no ar quando semeamos,
  e é ela que dá a palavra final.
*/
function useSeedFromDisk(channelId: string | undefined, postId?: string) {
  const client = useQueryClient();

  useEffect(() => {
    /* Post de fórum tem chave própria e histórico curto: não vale o disco. */
    if (!channelId || postId || !conversationOnDisk.available()) return;

    const key = queryKeys.channel.messages(channelId);
    if (client.getQueryData(key)) return;

    let wanted = true;

    void conversationOnDisk.read(channelId).then((messages) => {
      if (!wanted || !messages.length) return;
      if (client.getQueryData(key)) return;

      client.setQueryData(key, {
        pages: [{ messages, hasMore: true, withoutHistory: false }],
        pageParams: [undefined],
      });
    });

    return () => {
      wanted = false;
    };
  }, [channelId, postId, client]);
}

const nextPage = (lastPage: MessagePageModel) => (lastPage.hasMore ? lastPage.messages[0]?.id : undefined);

/*
  Para quem manda mensagem de fora da conversa, como o card de perfil: sem a
  primeira página carregada, a mensagem otimista não tem onde entrar, e uma
  recusa do servidor sumiria sem deixar rastro na tela.
*/
export const prefetchMessages = (client: QueryClient, channelId: string) =>
  client.prefetchInfiniteQuery({
    queryKey: queryKeys.channel.messages(channelId),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => findMessages({ channelId, before: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextPage,
    staleTime: Infinity,
  });

export const useFindMessages = (channelId: string | undefined, postId?: string) => {
  useSeedFromDisk(channelId, postId);

  return useInfiniteQuery({
    queryKey: postId
      ? queryKeys.channel.postMessages(postId)
      : queryKeys.channel.messages(channelId ?? ""),
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const page = await findMessages({ channelId: channelId!, before: pageParam, postId });

      /*
        Grava o que acabou de chegar, sem esperar. Se o disco falhar, a ponte
        engole e devolve zero: perder cache não pode atrapalhar quem só queria
        ler a conversa.
      */
      if (!postId) void conversationOnDisk.write(channelId!, page.messages);

      return page;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextPage,
    enabled: Boolean(channelId),
    staleTime: Infinity,
  });
};
