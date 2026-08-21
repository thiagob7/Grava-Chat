import { z } from "zod";
import { LIMITS } from "@gravae/shared";

export const presignInput = z.object({
  filename: z.string().min(1).max(256),
  contentType: z.string().min(1).max(128),
  size: z.number().int().positive().max(LIMITS.attachmentBytes),
});

export type PresignInput = z.infer<typeof presignInput>;
