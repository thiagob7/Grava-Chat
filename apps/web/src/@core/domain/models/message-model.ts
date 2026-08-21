import type { Message } from "@gravae/shared";

export type MessageModel = Message;

/** Mensagem ainda não confirmada pelo servidor (envio otimista). */
export type PendingMessageModel = MessageModel & {
  pending?: true;
  failed?: true;
  nonce?: string;
};

export interface MessagePageModel {
  messages: MessageModel[];
  hasMore: boolean;
}

export interface ReadStateModel {
  channelId: string;
  lastReadMessageId: string | null;
  mentionCount: number;
}
