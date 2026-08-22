import { z } from "zod";
import { FINALIDADES_DE_UPLOAD, LIMITS, TETO_POR_FINALIDADE } from "@gravae/shared";

/**
 * A finalidade e opcional e cai em `anexo`: um cliente antigo continua
 * subindo anexo do mesmo jeito, sem teto novo aparecendo do nada no meio de um
 * envio que antes funcionava.
 */
export const finalidadeDeUpload = z.enum(FINALIDADES_DE_UPLOAD).default("anexo");

export const presignInput = z
  .object({
    filename: z.string().min(1).max(256),
    contentType: z.string().min(1).max(128),
    size: z.number().int().positive().max(LIMITS.attachmentBytes),
    purpose: finalidadeDeUpload,
  })
  /**
   * O teto e conferido AQUI e nao no `max()` do campo porque depende de outro
   * campo do mesmo objeto. E vale lembrar que isto e a assinatura da URL: sem
   * a checagem, o `ContentLength` assinado ja autorizaria o arquivo inteiro.
   */
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

/**
 * Trazer pra ca uma imagem que ja esta na internet — hoje, o GIF escolhido no
 * seletor da faixa de perfil.
 *
 * A lista de hosts NAO e burocracia: sem ela isto e um SSRF de manual, e
 * qualquer cliente poderia mandar o servidor buscar `http://169.254.169.254/`
 * (o metadata da nuvem) ou um endereco da rede interna, e ainda receber o
 * conteudo de volta. So sai daqui o que veio do provedor de GIF que a propria
 * API consulta.
 */
const HOSTS_DE_GIF = new Set(["static.klipy.com", "media.tenor.com", "c.tenor.com"]);

export const importarImagemInput = z.object({
  url: z
    .url()
    .refine((u) => HOSTS_DE_GIF.has(new URL(u).hostname), "Endereco de imagem nao permitido"),
  purpose: finalidadeDeUpload,
});

export type ImportarImagemInput = z.infer<typeof importarImagemInput>;
