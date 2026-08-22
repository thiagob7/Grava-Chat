import type { FinalidadeDeUpload } from "@gravae/shared";

export interface FindMessagesDTO {
  channelId: string;
  before?: string;
  /** conversa de um assunto do fórum; sem isto, só as mensagens soltas do canal */
  postId?: string;
}

export interface PresignUploadDTO {
  filename: string;
  contentType: string;
  size: number;
  /** escolhe o teto de bytes no servidor; ausente = anexo */
  purpose?: FinalidadeDeUpload;
}
