
export const LINK = /https?:\/\/[^\s<]+/g;

export const limparLink = (url: string) => url.replace(/[.,;:!?)\]}]+$/, "");

export const EH_IMAGEM = /\.(gif|png|jpe?g|webp|avif)(\?|#|$)/i;

export const SO_UM_LINK = /^https?:\/\/\S+$/;

export function extrairLinks(conteudo: string, maximo = 3): string[] {
  const achados = new Set<string>();

  for (const [bruto] of conteudo.matchAll(LINK)) {
    const url = limparLink(bruto);

    if (EH_IMAGEM.test(url)) continue;

    achados.add(url);
    if (achados.size >= maximo) break;
  }

  return [...achados];
}
