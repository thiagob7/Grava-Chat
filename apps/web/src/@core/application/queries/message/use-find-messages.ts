import { useInfiniteQuery } from "@tanstack/react-query";

import { findMessages } from "~/@core/application/requests/message/find-messages";
import type { MessagePageModel } from "~/@core/domain/models/message-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindMessages = (channelId: string | undefined, postId?: string) =>
  useInfiniteQuery({
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
