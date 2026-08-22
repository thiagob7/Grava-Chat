import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.js";
import { TETO_POR_FINALIDADE } from "@gravae/shared";
import { AppError } from "~/lib/http.js";
import type { ImportarImagemInput, PresignInput } from "~/validations/upload.js";

const s3 = new S3Client({
  region: env.R2_REGION,
  endpoint: env.R2_ENDPOINT,
  // O R2 aceita os dois estilos; o MinIO (fallback offline) só aceita path style.
  forcePathStyle: true,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

/** Tipos que o navegador exibe inline. Qualquer outra coisa vai como anexo. */
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export const uploadService = {
  /**
   * O arquivo NÃO passa pela API: o browser faz PUT direto no storage com esta
   * URL assinada. Streamar 50 MB por dentro do Node só pra reenviar ao S3
   * consome memória e trava o event loop à toa.
   */
  isImage: (contentType: string) => IMAGE_TYPES.includes(contentType),

  /** Caminho da chave, isolando os arquivos deste app dentro do bucket. */
  buildKey(userId: string, filename: string) {
    const safeName = filename.replace(/[^\w.\-]/g, "_").slice(-100);
    return [env.R2_PREFIX, userId, randomUUID(), safeName].filter(Boolean).join("/");
  },

  publicUrl(key: string) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  },

  /**
   * Recebe o arquivo e grava no storage.
   *
   * Usado quando o navegador NÃO pode falar direto com o bucket — o R2 recusa
   * PUT de outra origem enquanto não houver política de CORS configurada no
   * painel. Custa banda da API, então o caminho direto (presign) continua sendo
   * o preferido: é só ligar R2_DIRECT_UPLOAD depois de configurar o CORS.
   */
  async upload(userId: string, file: { filename: string; contentType: string; body: Buffer }) {
    const key = uploadService.buildKey(userId, file.filename);

    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        Body: file.body,
        ContentType: file.contentType,
      }),
    );

    return {
      id: key,
      url: uploadService.publicUrl(key),
      filename: file.filename,
      contentType: file.contentType,
      size: file.body.length,
    };
  },

  /**
   * Baixa uma imagem de fora e guarda no NOSSO bucket.
   *
   * Existe porque o GIF do seletor vem do CDN do provedor, e todo endereco que
   * gravamos em perfil precisa ser do nosso bucket — e a regra que impede um
   * `bannerUrl` externo de virar pixel de rastreamento carregado por todo mundo
   * que abre o perfil. De brinde, o GIF continua vivo se o provedor mudar de
   * endereco.
   *
   * O host ja foi conferido na validacao; aqui o cuidado e com o TAMANHO: o
   * `content-length` e conferido antes de baixar, e o corpo e conferido depois
   * — um servidor pode mentir no cabecalho, ou nem manda-lo.
   */
  async importar(userId: string, input: ImportarImagemInput) {
    const teto = TETO_POR_FINALIDADE[input.purpose];

    const resposta = await fetch(input.url, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
    if (!resposta?.ok) throw new AppError("Nao consegui baixar essa imagem", 502);

    const anunciado = Number(resposta.headers.get("content-length") ?? 0);
    if (anunciado > teto) throw new AppError(`A imagem passa de ${Math.round(teto / 1024)} KB`, 413);

    const contentType = resposta.headers.get("content-type") ?? "";
    if (!uploadService.isImage(contentType)) throw new AppError("Isso nao e uma imagem");

    const body = Buffer.from(await resposta.arrayBuffer());
    if (body.length > teto) throw new AppError(`A imagem passa de ${Math.round(teto / 1024)} KB`, 413);

    const extensao = contentType.split("/")[1]?.split(";")[0] ?? "gif";

    return uploadService.upload(userId, {
      filename: `importada.${extensao}`,
      contentType,
      body,
    });
  },

  async presign(userId: string, input: PresignInput) {
    const key = uploadService.buildKey(userId, input.filename);

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        ContentType: input.contentType,
        ContentLength: input.size,
      }),
      { expiresIn: 300 },
    );

    return {
      uploadUrl,
      attachment: {
        id: key,
        url: uploadService.publicUrl(key),
        filename: input.filename,
        contentType: input.contentType,
        size: input.size,
      },
    };
  },
};
