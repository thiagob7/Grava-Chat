import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  closePost,
  createPost,
  findPosts,
} from "~/@core/application/requests/forum/forum";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindPosts = (channelId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.forum.posts(channelId ?? ""),
    queryFn: () => findPosts(channelId!),
    enabled: Boolean(channelId) && enabled,
  });

export const useCreatePost = (channelId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      if (channelId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts(channelId) });
      }
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Erro ao criar o assunto.")),
  });
};

export const useClosePost = (channelId: string | undefined) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closePost,
    onSuccess: (post) => {
      void queryClient.setQueryData(queryKeys.forum.post(post.id), post);
      if (channelId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts(channelId) });
      }
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Erro ao fechar o assunto.")),
  });
};
