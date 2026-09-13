import type { Message, FailureReason } from "@gravae/shared";

export type MessageModel = Message;

export type PendingMessageModel = MessageModel & {
  pending?: true;
  failed?: true;
  /*
    Não saiu, mas vai sair. É diferente de `failed`, que é o fim da linha: esta
    está guardada no disco e o vigia leva quando a conexão voltar. Mostrar as
    duas do mesmo jeito faria a pessoa reescrever o que já ia sozinho.
  */
  queued?: true;
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
