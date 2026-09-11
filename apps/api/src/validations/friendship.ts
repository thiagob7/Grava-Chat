import { z } from "zod";
import { objectId, NOTE_LIMIT, LIMITS } from "@gravae/shared";

export const requestFriendInput = z.object({
  username: z.string().min(1).max(LIMITS.username + 1),
  note: z.string().trim().max(NOTE_LIMIT).nullable().optional(),
});

export const friendshipParams = z.object({ friendshipId: objectId });
export const respondFriendInput = z.object({ accept: z.boolean() });
export const openDmInput = z.object({ userId: objectId });

export const dmInputReplyRequest = z.object({
  action: z.enum(["aceitar", "ignorar", "spam"]),
});
