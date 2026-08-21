import type { ForumPostPayload, Message } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export type ForumPostModel = ForumPostPayload;

export async function findPosts(
  channelId: string,
): Promise<{ posts: ForumPostModel[]; hasMore: boolean }> {
  const response = await api.get<{ posts: ForumPostModel[]; hasMore: boolean }>(
    `/channels/${channelId}/posts`,
  );
  return response.data;
}

export async function findPost(postId: string): Promise<ForumPostModel> {
  const response = await api.get<ForumPostModel>(`/posts/${postId}`);
  return response.data;
}

export interface CreatePostDTO {
  channelId: string;
  title: string;
  content: string;
  tags?: string[];
}

export async function createPost({ channelId, ...data }: CreatePostDTO) {
  const response = await api.post<{ post: ForumPostModel; message: Message }>(
    `/channels/${channelId}/posts`,
    data,
  );
  return response.data;
}

export async function closePost({ postId, closed }: { postId: string; closed: boolean }) {
  const response = await api.patch<ForumPostModel>(`/posts/${postId}`, { closed });
  return response.data;
}
