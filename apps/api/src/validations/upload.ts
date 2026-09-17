import { z } from "zod";
import { UPLOAD_PURPOSES, CEILING_BY_PURPOSE, HIGHEST_LIMITS } from "@gravae/shared";

export const uploadPurpose = z.enum(UPLOAD_PURPOSES).default("anexo");

export const presignInput = z
  .object({
    filename: z.string().min(1).max(256),
    contentType: z.string().min(1).max(128),
    size: z.number().int().positive().max(HIGHEST_LIMITS.attachmentBytes),
    purpose: uploadPurpose,
  })
  .superRefine((v, ctx) => {
    if (v.purpose === "anexo") return;

    const ceiling = CEILING_BY_PURPOSE[v.purpose];
    if (v.size <= ceiling) return;

    ctx.addIssue({
      code: "custom",
      path: ["size"],
      message: `Passa do limite de ${Math.round(ceiling / 1024)} KB para ${v.purpose}`,
    });
  });

export type PresignInput = z.infer<typeof presignInput>;

const HOSTS_DE_GIF = new Set(["static.klipy.com", "media.tenor.com", "c.tenor.com"]);

export const importImageInput = z.object({
  url: z
    .url()
    .refine((u) => HOSTS_DE_GIF.has(new URL(u).hostname), "Endereco de imagem nao permitido"),
  purpose: uploadPurpose,
});

export type ImportImageInput = z.infer<typeof importImageInput>;
