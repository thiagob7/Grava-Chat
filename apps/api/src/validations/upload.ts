import { z } from "zod";
import { FINALIDADES_DE_UPLOAD, LIMITS, TETO_POR_FINALIDADE } from "@gravae/shared";

export const finalidadeDeUpload = z.enum(FINALIDADES_DE_UPLOAD).default("anexo");

export const presignInput = z
  .object({
    filename: z.string().min(1).max(256),
    contentType: z.string().min(1).max(128),
    size: z.number().int().positive().max(LIMITS.attachmentBytes),
    purpose: finalidadeDeUpload,
  })
  .superRefine((v, ctx) => {
    const teto = TETO_POR_FINALIDADE[v.purpose];
    if (v.size <= teto) return;

    ctx.addIssue({
      code: "custom",
      path: ["size"],
      message: `Passa do limite de ${Math.round(teto / 1024)} KB para ${v.purpose}`,
    });
  });

export type PresignInput = z.infer<typeof presignInput>;

const HOSTS_DE_GIF = new Set(["static.klipy.com", "media.tenor.com", "c.tenor.com"]);

export const importarImagemInput = z.object({
  url: z
    .url()
    .refine((u) => HOSTS_DE_GIF.has(new URL(u).hostname), "Endereco de imagem nao permitido"),
  purpose: finalidadeDeUpload,
});

export type ImportarImagemInput = z.infer<typeof importarImagemInput>;
