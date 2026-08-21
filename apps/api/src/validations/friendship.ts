import { z } from "zod";
import { objectId, LIMITS } from "@gravae/shared";

export const requestFriendInput = z.object({
  username: z.string().min(1).max(LIMITS.username + 1),
});

export const friendshipParams = z.object({ friendshipId: objectId });
export const respondFriendInput = z.object({ accept: z.boolean() });
export const openDmInput = z.object({ userId: objectId });
