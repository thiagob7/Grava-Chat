import { z } from "zod";
import { GUILD_BIO_MAX } from "@gravae/shared";

import { r2Url } from "~/validations/auth.js";

export const guildProfileInput = z.object({
  avatarUrl: r2Url.nullable().optional(),
  bannerUrl: r2Url.nullable().optional(),
  bio: z.string().max(GUILD_BIO_MAX).nullable().optional(),
});

export type GuildProfileInput = z.infer<typeof guildProfileInput>;
