import type { Message, FailureReason } from "@gravae/shared";

export type MessageModel = Message;

export type PendingMessageModel = MessageModel & {
  pending?: true;
  failed?: true;
  reason?: FailureReason;
  nonce?: string;
};

export interface MessagePageModel {
  messages: MessageModel[];
  hasMore: boolean;
  withoutHistory?: boolean;
}

export interface ReadStateModel {
  channelId: string;
  guildId: string | null;
  channelName?: string | null;
  lastReadMessageId: string | null;
  unreadCount: number;
  mentionCount: number;
}
