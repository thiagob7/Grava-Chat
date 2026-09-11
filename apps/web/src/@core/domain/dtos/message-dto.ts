import type { UploadPurpose } from "@gravae/shared";

export interface FindMessagesDTO {
  channelId: string;
  before?: string;
  postId?: string;
}

export interface PresignUploadDTO {
  filename: string;
  contentType: string;
  size: number;
  purpose?: UploadPurpose;
}
