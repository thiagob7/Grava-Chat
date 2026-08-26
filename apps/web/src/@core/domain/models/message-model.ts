import type { Message } from "@gravae/shared";

export type MessageModel = Message;

export type PendingMessageModel = MessageModel & {
  pending?: true;
  failed?: true;
  nonce?: string;
};

export interface MessagePageModel {
  messages: MessageModel[];
  hasMore: boolean;
  semHistorico?: boolean;
}

export interface ReadStateModel {
  channelId: string;
  /// nulo em conversa privada, que não pertence a servidor nenhum
  guildId: string | null;
  lastReadMessageId: string | null;
  unreadCount: number;
  mentionCount: number;
}
