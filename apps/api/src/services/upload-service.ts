import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env.js";
import { TETO_POR_FINALIDADE } from "@gravae/shared";
import { AppError } from "~/lib/http.js";
import { redis, keys } from "~/lib/redis.js";
import { cabeNaCota, mensagemDeCota, JANELA_DA_COTA_S } from "~/lib/cota-de-upload.js";
import type { ImportarImagemInput, PresignInput } from "~/validations/upload.js";

const s3 = new S3Client({
  region: env.R2_REGION,
  endpoint: env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

export const uploadService = {
  isImage: (contentType: string) => IMAGE_TYPES.includes(contentType),

  /**
   * Debita `tamanho` da cota horária de quem está enviando, ou recusa.
   *
   * O contador é incrementado ANTES do arquivo subir, e não depois. Depois
   * seria tarde: no envio direto (`presign`) o arquivo vai do navegador pro R2
   * sem passar por aqui, e nunca saberíamos o que entrou. O preço de cobrar
   * antes é que um envio abandonado no meio conta na cota até a janela virar —
   * o que é justo, porque a intenção de gastar existiu.
   *
   * Falha do Redis DEIXA PASSAR, pela mesma razão do rate limit: perder a
   * contagem por alguns segundos é melhor que impedir todo mundo de mandar
   * anexo porque o Redis piscou.
   */
  async reservarCota(userId: string, tamanho: number) {
    const chave = keys.cotaDeUpload(userId);

    const jaUsado = await redis.get(chave).then(Number).catch(() => 0);
    if (!cabeNaCota({ jaUsado: jaUsado || 0, tamanho })) {
      throw new AppError(mensagemDeCota({ jaUsado: jaUsado || 0 }), 429);
    }

    await redis
      .multi()
      .incrby(chave, tamanho)
      /// só na primeira gravação da janela; renovar a cada envio faria a hora
      /// nunca virar pra quem manda sem parar
      .expire(chave, JANELA_DA_COTA_S, "NX")
      .exec()
      .catch(() => undefined);
  },

  buildKey(userId: string, filename: string) {
    const safeName = filename.replace(/[^\w.\-]/g, "_").slice(-100);
    return [env.R2_PREFIX, userId, randomUUID(), safeName].filter(Boolean).join("/");
  },

  publicUrl(key: string) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  },

  async upload(userId: string, file: { filename: string; contentType: string; body: Buffer }) {
    await uploadService.reservarCota(userId, file.body.length);

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
   * Apaga objetos do R2. Sem alarde, e sem nunca derrubar quem chamou.
   *
   * Existe porque o armazenamento só crescia: apagar mensagem marcava
   * `deletedAt` e o anexo ficava no bucket pra sempre, sendo cobrado por um
   * arquivo que ninguém mais consegue ver — todas as leituras filtram mensagem
   * apagada, e não existe desfazer.
   *
   * Falha aqui é ENGOLIDA de propósito. Se o R2 estiver fora do ar, apagar a
   * mensagem tem que funcionar mesmo assim: o pior caso de engolir é um arquivo
   * órfão a mais; o pior caso de propagar é a pessoa não conseguir apagar o que
   * mandou. O primeiro custa centavos, o segundo é o produto quebrado.
   *
   * O `id` do anexo É a chave no R2 — ver `buildKey`, que alimenta os dois.
   */
  async remover(chaves: string[]) {
    if (!chaves.length) return;

    /// O DeleteObjects aceita 1000 por chamada; lotes maiores viram várias.
    for (let i = 0; i < chaves.length; i += 1000) {
      await s3
        .send(
          new DeleteObjectsCommand({
            Bucket: env.R2_BUCKET,
            Delete: { Objects: chaves.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
          }),
        )
        .catch((erro: unknown) => {
          console.error("[r2] nao consegui apagar anexos:", (erro as Error).message);
        });
    }
  },

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
    /*
      Cobrar pelo tamanho ANUNCIADO é seguro porque o `ContentLength` abaixo
      entra na assinatura da URL: mandar mais bytes do que o declarado faz o
      próprio R2 recusar. Sem isso, bastaria dizer "1 byte" e subir 50 MB.
    */
    await uploadService.reservarCota(userId, input.size);

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
