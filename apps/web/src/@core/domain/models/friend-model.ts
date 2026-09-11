import type { Channel, PublicUser } from "@gravae/shared";

export type FriendshipStatus = "ACCEPTED" | "PENDING_IN" | "PENDING_OUT" | "BLOCKED";

export interface FriendshipModel {
  id: string;
  user: PublicUser;
  status: FriendshipStatus;
  note?: string | null;
  createdAt: string;
}

export type DmChannelModel = Channel & {
  lastMessageId: string | null;
  user: PublicUser;
};
