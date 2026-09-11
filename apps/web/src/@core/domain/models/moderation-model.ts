import type { Permission } from "@gravae/shared";

export interface ModerationViewModel {
  activity: { messages: number; links: number; media: number };
  audit: { made: number; suffered: number };
  permissions: Permission[];
  roleIds: string[];
  joinedServer: string;
  joinedGravae: string;
  timeoutUntil: string | null;
  joining: { inviteCode: string | null; invitedBy: string | null };
}

export interface ModerationMessageModel {
  id: string;
  channelId: string;
  channelName: string;
  channelType: "TEXT" | "VOICE" | "FORUM";
  content: string;
  attachments: { url: string; filename: string; contentType: string }[];
  createdAt: string;
}
