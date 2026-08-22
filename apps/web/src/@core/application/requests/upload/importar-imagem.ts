import type { Attachment, FinalidadeDeUpload } from "@gravae/shared";
import { api } from "~/@core/lib/api";

/**
 * Traz pro nosso bucket uma imagem que já está na internet — hoje, o GIF
 * escolhido no seletor da faixa.
 *
 * Quem baixa é o servidor, não o navegador: buscar um arquivo de outra origem
 * pelo `fetch` depende de o CDN mandar cabeçalho de CORS, e o do provedor de
 * GIF não manda. Pelo servidor funciona sempre.
 */
export async function importarImagem(
  url: string,
  purpose: FinalidadeDeUpload,
): Promise<Attachment> {
  const resposta = await api.post<Attachment>("/uploads/importar", { url, purpose });
  return resposta.data;
}
