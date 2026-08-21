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
}
