import type { FinalidadeDeUpload } from "@gravae/shared";

export interface FindMessagesDTO {
  channelId: string;
  before?: string;
  postId?: string;
}

export interface PresignUploadDTO {
  filename: string;
  contentType: string;
  size: number;
  purpose?: FinalidadeDeUpload;
}
