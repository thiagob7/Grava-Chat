import { z } from "zod";
import { objectId } from "@gravae/shared";

export { objectId };

export const guildParams = z.object({ guildId: objectId });
export const channelParams = z.object({ channelId: objectId });
export const guildChannelParams = z.object({ guildId: objectId, channelId: objectId });
export const guildMemberParams = z.object({ guildId: objectId, userId: objectId });
export const guildPostParams = z.object({ guildId: objectId, postId: objectId });
export const postParams = z.object({ postId: objectId });

export const inviteParams = z.object({ code: z.string().min(1).max(64) });
